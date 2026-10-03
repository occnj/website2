// Change approval — shared logic.
//
// Everything here is free of environment access and of Next.js, so it can be
// unit-tested (tests/changeRequests.test.js) and reused by:
//   • app/api/change-requests/notify  (email the approvers)
//   • app/api/change-requests/decide  (approve / reject from an email link)
//   • app/review                      (the page an email link opens)
//   • the Admin panel                 (window.OasisChanges.describe)

const TABLE_LABELS = {
  page_overrides: 'Page (visual editor)',
  pages: 'Page settings',
  page_blocks: 'Page block',
  site_settings: 'Site settings',
  form_settings: 'Form / approval settings',
  nav_items: 'Navigation',
  events: 'Event',
  sermons: 'Sermon',
  team_members: 'Team member',
  team_sections: 'Team section',
  ministries: 'Ministry',
  ministry_posts: 'Ministry post',
  about_hub_cards: 'About card',
  beliefs: 'Belief',
  core_values: 'Core value',
  faqs: 'FAQ',
  profiles: 'User account / role',
};

// Columns that change on every save and say nothing useful.
const NOISE_KEYS = new Set(['updated_at', 'updated_by', 'created_at', 'sig', 'sort_order']);
// Columns that send visitors somewhere else — worth a second look.
const LINK_KEY = /(^|[._])(href|url|link|links|registration_url|donate_url|calendar_url)($|[._])/i;
const TITLE_KEYS = ['title', 'name', 'label', 'question', 'slug', 'full_name'];
const BUCKET_LABELS = { text: 'Text', copy: 'Text', img: 'Image', href: 'Link', style: 'Style', hidden: 'Section', added: 'Added block' };

export const TOKEN_MAX_AGE_DAYS = 30;

export function tableLabel(t) { return TABLE_LABELS[t] || t; }

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function stripHtml(s) {
  return String(s == null ? '' : s)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

export function clip(s, n = 280) {
  s = String(s == null ? '' : s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function parseRecipients(value) {
  const list = String(value || '')
    .split(/[\s,;]+/).map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  return [...new Set(list)];
}

// {a:{b:1}} -> {'a.b': 1} (leaves only; top-level noise columns skipped)
function flatten(obj, prefix = '', out = {}) {
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) {
      if (!prefix && NOISE_KEYS.has(k)) continue;
      flatten(obj[k], prefix ? prefix + '.' + k : k, out);
    }
  } else if (prefix) {
    out[prefix] = obj === undefined ? null : obj;
  }
  return out;
}

function asText(v) {
  if (v == null) return '';
  return typeof v === 'string' ? v : JSON.stringify(v);
}

function itemName(data) {
  if (!data) return '';
  for (const k of TITLE_KEYS) if (data[k]) return stripHtml(data[k]);
  return '';
}

// One change (a pending request, or a history row) as something a person can
// read: { headline, lines: [{ what, before, after, risky }], reasons, risky }.
// Every string is plain text — callers must escape before putting it in HTML.
export function describeChange(c) {
  const label = tableLabel(c.table_name);
  const name = itemName(c.new_data) || itemName(c.old_data);
  const reasons = [];
  let lines = [];
  let headline;

  if (c.table_name === 'page_overrides') {
    const oldE = (c.old_data && c.old_data.edits) || {};
    const newE = c.op === 'DELETE' ? {} : ((c.new_data && c.new_data.edits) || {});
    const sig = newE.sig || oldE.sig || {};
    headline = `${label}: /${c.pk_value === 'index' ? '' : c.pk_value}`;
    const a = flatten(oldE), b = flatten(newE);
    for (const path of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (JSON.stringify(a[path]) === JSON.stringify(b[path])) continue;
      const [bucket, ...rest] = path.split('.');
      const key = rest.join('.');
      let before = a[path], after = b[path];
      if (bucket === 'hidden') { lines.push({ what: 'Section', before: '', after: after ? 'hidden from the page' : 'shown again', risky: false }); continue; }
      if (bucket === 'text' || bucket === 'copy') {
        // First edit of this element: show the page's original wording as "before".
        if (before == null && sig[key]) before = sig[key];
        before = stripHtml(before); after = stripHtml(after);
      }
      const risky = bucket === 'href';
      if (risky) reasons.push('a link was changed');
      lines.push({ what: BUCKET_LABELS[bucket] || bucket, before: clip(asText(before)), after: clip(asText(after)), risky });
    }
  } else if (c.op === 'INSERT') {
    headline = `New ${label.toLowerCase()}${name ? ': ' + name : ''}`;
    lines = Object.entries(flatten(c.new_data || {}))
      .filter(([k, v]) => v !== null && v !== '' && v !== false && !/(^|\.)id$|_id$/.test(k))
      .map(([k, v]) => {
        const risky = LINK_KEY.test(k);
        if (risky) reasons.push('it contains a link');
        return { what: k, before: '', after: clip(stripHtml(asText(v))), risky };
      });
  } else if (c.op === 'DELETE') {
    headline = `Delete ${label.toLowerCase()}${name ? ': ' + name : ''}`;
    reasons.push('something would be deleted');
    lines = [{ what: 'Remove', before: clip(name || c.pk_value), after: '', risky: true }];
  } else {
    headline = `${label}${name ? ': ' + name : ''}`;
    const a = flatten(c.old_data || {}), b = flatten(c.new_data || {});
    for (const path of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (JSON.stringify(a[path]) === JSON.stringify(b[path])) continue;
      const risky = LINK_KEY.test(path) && !!b[path];
      if (risky) reasons.push('a link was changed');
      lines.push({ what: path, before: clip(stripHtml(asText(a[path]))), after: clip(stripHtml(asText(b[path]))), risky });
    }
  }
  if (c.table_name === 'site_settings' || c.table_name === 'nav_items') reasons.push('it affects every page');
  if (!lines.length) lines.push({ what: 'No visible difference', before: '', after: '', risky: false });

  const uniq = [...new Set(reasons)];
  return { headline, lines: lines.slice(0, 40), extra: Math.max(0, lines.length - 40), reasons: uniq, risky: uniq.length > 0 };
}

// ---------- email ----------
function linesHtml(desc) {
  const rows = desc.lines.map((l) =>
    `<tr style="background:${l.risky ? '#fff4e5' : '#f9f8f6'}">` +
    `<td style="padding:6px 10px;white-space:nowrap;vertical-align:top;color:#555;border-bottom:2px solid #fff">${esc(l.what)}</td>` +
    `<td style="padding:6px 10px;vertical-align:top;border-bottom:2px solid #fff">` +
    (l.before ? `<span style="color:#a33;text-decoration:line-through">${esc(l.before)}</span><br>` : '') +
    (l.after ? `<span style="color:#1a6b34">${esc(l.after)}</span>` : (l.before ? '<span style="color:#777">(removed)</span>' : '')) +
    `</td></tr>`).join('');
  return `<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:6px">${rows}` +
    (desc.extra ? `<tr><td colspan="2" style="padding:6px 10px;color:#777">…and ${desc.extra} more on the review page</td></tr>` : '') + `</table>`;
}

// items: [{ request, url }] — all for ONE recipient (each link is personal).
export function renderApprovalEmail({ items, adminUrl, siteName = 'Oasis website' }) {
  const names = [...new Set(items.map((i) => i.request.requested_by_name || 'A team member'))];
  const who = names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2} more` : names.join(' & ');
  const n = items.length;
  const anyRisky = items.some((i) => describeChange(i.request).risky);
  const subject = `${anyRisky ? '⚠ ' : ''}Approval needed: ${n} website change${n === 1 ? '' : 's'} from ${who}`;

  const html = [`<div style="font-family:system-ui,Arial,sans-serif;max-width:680px;color:#12202c">`,
    `<h2 style="margin:0 0 6px">${n} change${n === 1 ? '' : 's'} waiting for your approval</h2>`,
    `<p style="margin:0 0 16px;color:#555">Nothing below is on the ${esc(siteName)} yet. Open a change to approve or reject it.</p>`];
  const text = [`${n} website change(s) are waiting for your approval. Nothing below is live yet.`, ''];

  for (const { request: r, url } of items) {
    const d = describeChange(r);
    html.push(`<div style="border:1px solid #e3e1dc;border-radius:8px;padding:14px 16px;margin:0 0 14px">`,
      `<div style="font-weight:600;font-size:16px">${esc(d.headline)}</div>`,
      `<div style="color:#777;font-size:13px">Requested by ${esc(r.requested_by_name || 'Unknown')}${r.requested_by_email ? ' · ' + esc(r.requested_by_email) : ''}</div>`,
      d.risky ? `<div style="background:#e08a00;color:#fff;border-radius:4px;padding:3px 8px;font-size:12px;display:inline-block;margin-top:6px">Look closely: ${esc(d.reasons.join('; '))}</div>` : '',
      linesHtml(d),
      `<p style="margin:14px 0 0"><a href="${esc(url)}" style="background:#0077A3;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">Review &amp; approve</a></p>`,
      `</div>`);
    text.push(`* ${d.headline} — requested by ${r.requested_by_name || 'Unknown'}${d.risky ? '  [LOOK CLOSELY: ' + d.reasons.join('; ') + ']' : ''}`);
    for (const l of d.lines) text.push(`    ${l.what}: ${l.before ? '"' + l.before + '" -> ' : ''}${l.after ? '"' + l.after + '"' : '(removed)'}`);
    text.push(`    Review and approve: ${url}`, '');
  }
  html.push(`<p style="color:#777;font-size:12px">These links are personal to you — please do not forward this email. ` +
    `You can also review everything in <a href="${esc(adminUrl)}">Admin → Approvals</a>.</p></div>`);
  text.push(`These links are personal to you — please do not forward this email.`, `Admin: ${adminUrl}`);
  return { subject, html: html.join(''), text: text.join('\n') };
}

// ---------- email the approvers about requests they have not heard about ----------
// sb: service-role Supabase client · send({to, subject, html, text}) · reviewUrl(token) -> link
// Requests are claimed (notified_at set) BEFORE sending so two overlapping calls
// can never email the same change twice, and released again if nothing could be sent.
export async function notifyApprovers({ sb, send, reviewUrl, newToken, adminUrl, now = Date.now() }) {
  const { data: settings, error: sErr } = await sb.from('form_settings').select('change_alert_recipients').eq('id', 1).maybeSingle();
  if (sErr) throw new Error('reading approvers: ' + sErr.message);
  const recipients = parseRecipients(settings && settings.change_alert_recipients);

  const stamp = new Date(now).toISOString();
  const { data: claimed, error: cErr } = await sb.from('change_requests')
    .update({ notified_at: stamp }).eq('status', 'pending').is('notified_at', null).select('*');
  if (cErr) throw new Error('reading requests: ' + cErr.message);
  if (!claimed || !claimed.length) return { status: 'nothing', count: 0 };
  claimed.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const ids = claimed.map((r) => r.id);
  const release = () => sb.from('change_requests').update({ notified_at: null }).in('id', ids);

  if (!recipients.length) { await release(); return { status: 'no_recipients', count: claimed.length }; }

  const tokens = [];
  const perRecipient = recipients.map((to) => ({
    to,
    items: claimed.map((request) => {
      const token = newToken();
      tokens.push({ token, request_id: request.id, recipient: to });
      return { request, url: reviewUrl(token) };
    }),
  }));
  const { error: tErr } = await sb.from('change_request_tokens').insert(tokens);
  if (tErr) { await release(); throw new Error('saving links: ' + tErr.message); }

  let delivered = 0; let lastError = null;
  for (const { to, items } of perRecipient) {
    try { await send({ to, ...renderApprovalEmail({ items, adminUrl }) }); delivered++; }
    catch (e) { lastError = e; }
  }
  if (!delivered) {
    await sb.from('change_request_tokens').delete().in('token', tokens.map((t) => t.token));
    await release();
    throw lastError || new Error('email could not be sent');
  }
  return { status: 'sent', count: claimed.length, recipients: delivered, failed: recipients.length - delivered };
}

// ---------- look up what an email link points at ----------
export async function loadByToken({ sb, token, now = Date.now() }) {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(String(token || ''))) return { status: 'invalid' };
  const { data: t } = await sb.from('change_request_tokens').select('request_id, recipient, created_at').eq('token', token).maybeSingle();
  if (!t) return { status: 'invalid' };
  const { data: request } = await sb.from('change_requests').select('*').eq('id', t.request_id).maybeSingle();
  if (!request) return { status: 'invalid' };
  if (request.status !== 'pending') return { status: 'decided', request, recipient: t.recipient };
  if (now - new Date(t.created_at).getTime() > TOKEN_MAX_AGE_DAYS * 86400000) return { status: 'expired', request, recipient: t.recipient };
  return { status: 'pending', request, recipient: t.recipient };
}

// ---------- approve / reject from an email link ----------
export async function decideByToken({ sb, token, action, note = '', force = false, now = Date.now() }) {
  if (action !== 'approve' && action !== 'reject') return { status: 'invalid' };
  const found = await loadByToken({ sb, token, now });
  if (found.status !== 'pending') return found;

  const { error } = await sb.rpc('decide_change_request_internal', {
    p_id: found.request.id,
    p_decision: action === 'approve' ? 'approved' : 'rejected',
    p_by: found.recipient,
    p_note: String(note || '').slice(0, 500),
    p_force: !!force,
  });
  if (error) {
    const m = String(error.message || '');
    const conflict = ['row_changed_since', 'row_already_exists', 'row_missing'].find((k) => m.includes(k));
    if (conflict) return { status: 'conflict', conflict, request: found.request, recipient: found.recipient };
    if (m.includes('not_pending')) return { status: 'decided', request: found.request, recipient: found.recipient };
    throw new Error(m || 'could not apply the decision');
  }
  return { status: action === 'approve' ? 'approved' : 'rejected', request: found.request, recipient: found.recipient };
}
