import { describe, it, expect, vi } from 'vitest';
import {
  decideByToken, describeChange, loadByToken, notifyApprovers, parseRecipients, renderApprovalEmail, stripHtml,
} from '../lib/changeRequests';

const T0 = Date.parse('2026-10-03T15:00:00Z');
const req = (o) => ({
  id: 'r1', created_at: new Date(T0 - 60000).toISOString(), requested_by: 'u1', requested_by_name: 'Vic Volunteer',
  requested_by_email: 'vic@example.org', table_name: 'page_overrides', pk_value: 'about', op: 'UPDATE',
  old_data: { slug: 'about', edits: {} }, new_data: { slug: 'about', edits: { text: { 'main>p:1': 'New words' } } },
  status: 'pending', notified_at: null, ...o,
});

describe('helpers', () => {
  it('parses recipients: separators, junk, duplicates, case', () => {
    expect(parseRecipients('A@x.org, b@x.org;\nnope  a@x.org')).toEqual(['a@x.org', 'b@x.org']);
    expect(parseRecipients('')).toEqual([]);
  });
  it('strips html without double-unescaping', () => {
    expect(stripHtml('<b>Hi</b>&nbsp;there &amp; <i>you</i><br>ok')).toBe('Hi there & you ok');
    expect(stripHtml('&amp;lt;script&amp;gt;')).toBe('&lt;script&gt;');
  });
});

describe('describeChange', () => {
  it('shows the page\'s original wording as "before" on a first visual edit, without markup', () => {
    const d = describeChange(req({ new_data: { edits: { text: { 'main>p:1': '<b>Rude text</b>' }, sig: { 'main>p:1': 'Welcome to Oasis' } } } }));
    expect(d.headline).toBe('Page (visual editor): /about');
    expect(d.lines).toEqual([{ what: 'Text', before: 'Welcome to Oasis', after: 'Rude text', risky: false }]);
    expect(d.risky).toBe(false);
  });
  it('flags changed links, site-wide settings and deletions', () => {
    expect(describeChange(req({ new_data: { edits: { href: { 'a:1': 'https://evil.example/pay' } } } })).reasons).toContain('a link was changed');
    const s = describeChange(req({ table_name: 'site_settings', pk_value: '1', old_data: { id: 1, donate_url: 'https://good.example' }, new_data: { id: 1, donate_url: 'https://bad.example' } }));
    expect(s.lines[0]).toMatchObject({ what: 'donate_url', before: 'https://good.example', after: 'https://bad.example', risky: true });
    expect(s.reasons).toEqual(expect.arrayContaining(['a link was changed', 'it affects every page']));
    const del = describeChange(req({ table_name: 'events', op: 'DELETE', old_data: { id: 'e1', title: 'Easter Service' }, new_data: null }));
    expect(del.headline).toBe('Delete event: Easter Service');
    expect(del.risky).toBe(true);
  });
  it('describes a new item and ignores bookkeeping columns', () => {
    const d = describeChange(req({ table_name: 'events', op: 'INSERT', old_data: null, new_data: { id: 'e1', title: 'Picnic', starts_at: '2026-10-10', sort_order: 0, created_at: 'x', published: true } }));
    expect(d.headline).toBe('New event: Picnic');
    expect(d.lines.map((l) => l.what)).toEqual(['title', 'starts_at', 'published']);
    expect(d.risky).toBe(false);
  });
});

describe('renderApprovalEmail', () => {
  it('links each change to its personal review URL and escapes editor-controlled text', () => {
    const r = req({ requested_by_name: '<img src=x onerror=alert(1)>', new_data: { edits: { text: { k: '<script>alert(1)</script>Hi "there"' } } } });
    const mail = renderApprovalEmail({ items: [{ request: r, url: 'https://oasisnj.net/review?t=TOKEN' }], adminUrl: 'https://oasisnj.net/admin' });
    expect(mail.subject).toMatch(/^Approval needed: 1 website change from/);
    expect(mail.html).toContain('href="https://oasisnj.net/review?t=TOKEN"');
    expect(mail.html).not.toContain('<img src=x');
    expect(mail.html).not.toContain('<script>');
    expect(mail.text).toContain('https://oasisnj.net/review?t=TOKEN');
  });
  it('marks the subject when a change deserves a closer look', () => {
    const mail = renderApprovalEmail({ items: [{ request: req({ new_data: { edits: { href: { a: 'https://x.example' } } } }), url: 'u' }], adminUrl: 'a' });
    expect(mail.subject.startsWith('⚠ ')).toBe(true);
  });
});

// ---- small in-memory stand-in for the slice of supabase-js these functions use ----
function fakeSb({ requests = [], tokens = [], recipients = 'pastor@x.org, admin@x.org', rpc } = {}) {
  const tables = { change_requests: requests, change_request_tokens: tokens, form_settings: [{ id: 1, change_alert_recipients: recipients }] };
  const from = (name) => {
    const rows = tables[name];
    const q = { op: 'select', patch: null, f: [], sel: false };
    const run = () => {
      if (q.op === 'insert') { rows.push(...q.patch.map((r) => ({ created_at: new Date(T0).toISOString(), ...r }))); return { data: null, error: null }; }
      const m = rows.filter((r) => q.f.every((fn) => fn(r)));
      if (q.op === 'update') { m.forEach((r) => Object.assign(r, q.patch)); return { data: q.sel ? m.map((r) => ({ ...r })) : null, error: null }; }
      if (q.op === 'delete') { m.forEach((r) => rows.splice(rows.indexOf(r), 1)); return { data: null, error: null }; }
      return { data: m.map((r) => ({ ...r })), error: null };
    };
    const api = {
      select() { q.sel = true; return api; },
      update(p) { q.op = 'update'; q.patch = p; return api; },
      insert(p) { q.op = 'insert'; q.patch = p; return api; },
      delete() { q.op = 'delete'; return api; },
      eq(c, v) { q.f.push((r) => r[c] === v); return api; },
      is(c, v) { q.f.push((r) => (v === null ? r[c] == null : r[c] === v)); return api; },
      in(c, l) { q.f.push((r) => l.includes(r[c])); return api; },
      maybeSingle() { const out = run(); return Promise.resolve({ data: out.data[0] || null, error: null }); },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    return api;
  };
  return { from, rpc: rpc || vi.fn().mockResolvedValue({ data: { ok: true }, error: null }), tables };
}
let n = 0;
const opts = (sb, send) => ({ sb, send, now: T0, adminUrl: 'https://s/admin', reviewUrl: (t) => 'https://s/review?t=' + t, newToken: () => 'tok' + String(++n).padStart(40, '0') });

describe('notifyApprovers', () => {
  it('emails each approver once with their own links, and never twice for the same request', async () => {
    const requests = [req({ id: 'r1' }), req({ id: 'r2', table_name: 'events', op: 'INSERT', new_data: { title: 'Picnic' } }), req({ id: 'r3', status: 'approved' })];
    const sb = fakeSb({ requests }); const send = vi.fn().mockResolvedValue();
    const out = await notifyApprovers(opts(sb, send));
    expect(out).toMatchObject({ status: 'sent', count: 2, recipients: 2 });
    expect(send.mock.calls.map((c) => c[0].to)).toEqual(['pastor@x.org', 'admin@x.org']);
    expect(sb.tables.change_request_tokens).toHaveLength(4);                       // 2 requests × 2 approvers
    expect(new Set(sb.tables.change_request_tokens.map((t) => t.token)).size).toBe(4);
    const pastorTokens = sb.tables.change_request_tokens.filter((t) => t.recipient === 'pastor@x.org').map((t) => t.token);
    pastorTokens.forEach((t) => expect(send.mock.calls[0][0].html).toContain(t));
    pastorTokens.forEach((t) => expect(send.mock.calls[1][0].html).not.toContain(t)); // links are personal
    expect((await notifyApprovers(opts(sb, send))).status).toBe('nothing');
    expect(send).toHaveBeenCalledTimes(2);
  });
  it('keeps requests queued when no approver emails are set', async () => {
    const requests = [req()]; const sb = fakeSb({ requests, recipients: '' }); const send = vi.fn();
    expect(await notifyApprovers(opts(sb, send))).toMatchObject({ status: 'no_recipients', count: 1 });
    expect(send).not.toHaveBeenCalled();
    expect(requests[0].notified_at).toBeNull();
  });
  it('releases the requests and removes unusable links if every email fails', async () => {
    const requests = [req()]; const sb = fakeSb({ requests });
    await expect(notifyApprovers(opts(sb, vi.fn().mockRejectedValue(new Error('Resend 500'))))).rejects.toThrow('Resend 500');
    expect(requests[0].notified_at).toBeNull();
    expect(sb.tables.change_request_tokens).toHaveLength(0);
    expect((await notifyApprovers(opts(sb, vi.fn().mockResolvedValue()))).status).toBe('sent');   // retry works
  });
  it('still counts as sent when only some approvers could be emailed', async () => {
    const sb = fakeSb({ requests: [req()] });
    const send = vi.fn().mockRejectedValueOnce(new Error('bounce')).mockResolvedValue();
    expect(await notifyApprovers(opts(sb, send))).toMatchObject({ status: 'sent', recipients: 1, failed: 1 });
  });
});

describe('email links', () => {
  const TOKEN = 'a'.repeat(43);
  const setup = (o = {}) => fakeSb({ requests: [req(o.request)], tokens: [{ token: TOKEN, request_id: 'r1', recipient: 'pastor@x.org', created_at: new Date(o.tokenAt || T0).toISOString() }], rpc: o.rpc });

  it('rejects malformed and unknown links without touching the database functions', async () => {
    const sb = setup();
    expect((await loadByToken({ sb, token: 'short', now: T0 })).status).toBe('invalid');
    expect((await loadByToken({ sb, token: 'b'.repeat(43), now: T0 })).status).toBe('invalid');
    expect((await decideByToken({ sb, token: 'b'.repeat(43), action: 'approve', now: T0 })).status).toBe('invalid');
    expect((await decideByToken({ sb, token: TOKEN, action: 'publish-everything', now: T0 })).status).toBe('invalid');
    expect(sb.rpc).not.toHaveBeenCalled();
  });
  it('approves under the approver\'s email address', async () => {
    const sb = setup();
    const out = await decideByToken({ sb, token: TOKEN, action: 'approve', note: 'ok', now: T0 });
    expect(out.status).toBe('approved');
    expect(sb.rpc).toHaveBeenCalledWith('decide_change_request_internal', { p_id: 'r1', p_decision: 'approved', p_by: 'pastor@x.org', p_note: 'ok', p_force: false });
  });
  it('rejects with a note', async () => {
    const sb = setup();
    expect((await decideByToken({ sb, token: TOKEN, action: 'reject', note: 'x'.repeat(900), now: T0 })).status).toBe('rejected');
    expect(sb.rpc.mock.calls[0][1]).toMatchObject({ p_decision: 'rejected' });
    expect(sb.rpc.mock.calls[0][1].p_note).toHaveLength(500);
  });
  it('does not act on a request that was already decided, or on an expired link', async () => {
    const decided = setup({ request: { status: 'rejected' } });
    expect((await decideByToken({ sb: decided, token: TOKEN, action: 'approve', now: T0 })).status).toBe('decided');
    expect(decided.rpc).not.toHaveBeenCalled();
    const old = setup({ tokenAt: T0 - 31 * 86400000 });
    expect((await decideByToken({ sb: old, token: TOKEN, action: 'approve', now: T0 })).status).toBe('expired');
    expect(old.rpc).not.toHaveBeenCalled();
  });
  it('reports a conflict instead of overwriting newer edits, until forced', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'row_changed_since' } }).mockResolvedValue({ data: { ok: true }, error: null });
    const sb = setup({ rpc });
    expect(await decideByToken({ sb, token: TOKEN, action: 'approve', now: T0 })).toMatchObject({ status: 'conflict', conflict: 'row_changed_since' });
    expect((await decideByToken({ sb, token: TOKEN, action: 'approve', force: true, now: T0 })).status).toBe('approved');
    expect(rpc.mock.calls[1][1].p_force).toBe(true);
  });
});
