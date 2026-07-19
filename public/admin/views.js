// Oasis Admin — views (real Supabase CRUD)
const ICONS = {
  pages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h8l4 4v14H7z" stroke-linejoin="round"/><path d="M15 3v4h4M10 12h6M10 16h6" stroke-linecap="round"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m5 19 5.5-5.5 3 3L17 13l4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m14.5 5.5 4 4L8 20l-4.7.7L4 16z" stroke-linejoin="round"/><path d="m12.5 7.5 4 4"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 14 6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 10 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function fail(e) { console.error(e); toast('⚠ ' + (e.message || e)); }
function needSetup(msg) {
  return '<div class="panel"><div class="panel-body" style="color:var(--gray-1)">' + msg + '</div></div>';
}
async function safe(fn) {
  try { return await fn(); }
  catch (e) {
    console.error(e);
    return needSetup('Could not load data: <strong>' + esc(e.message) + '</strong><br><br>If tables are missing, run <code>supabase-setup.sql</code> in the Supabase SQL Editor first.');
  }
}
function ytIdFrom(input) {
  const m = String(input).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || String(input).match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}
function fmtDate(d) {
  if (!d) return '';
  return new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------- generic reorder (swap sort_order with neighbor) ----------
async function moveRow(table, id, dir, view, eq) {
  try {
    const opts = { order: [['sort_order', 'asc']] };
    if (eq) opts.eq = eq;
    const rows = await DB.list(table, opts);
    const i = rows.findIndex(function (r) { return r.id === id; });
    const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return;
    rows.forEach(function (r, k) { r.sort_order = k; }); // normalize
    const tmp = rows[i].sort_order; rows[i].sort_order = rows[j].sort_order; rows[j].sort_order = tmp;
    await DB.save(table, { id: rows[i].id, sort_order: rows[i].sort_order });
    await DB.save(table, { id: rows[j].id, sort_order: rows[j].sort_order });
    go(view);
  } catch (e) { fail(e); }
}

// ---------- confirm modal ----------
let pendingConfirm = null;
function confirmAction(msg, fn) {
  pendingConfirm = fn;
  document.getElementById('confirm-msg').innerHTML = msg;
  document.getElementById('confirm-modal').classList.add('open');
}
function runConfirm() {
  document.getElementById('confirm-modal').classList.remove('open');
  if (pendingConfirm) pendingConfirm();
  pendingConfirm = null;
}

// ---------- generic editor modal ----------
// fields: [{key,label,type:'text'|'textarea'|'date'|'select'|'check'|'image',options,hint,half}]
let editorCtx = null;
function openEditor(title, fields, row, onSave) {
  editorCtx = { fields: fields, row: row || {}, onSave: onSave };
  document.getElementById('editor-title').textContent = title;
  const body = fields.map(function (f) {
    const v = (row && row[f.key] != null) ? row[f.key] : (f.default != null ? f.default : '');
    let ctrl;
    if (f.type === 'textarea') ctrl = '<textarea class="form-textarea" id="fld-' + f.key + '">' + esc(v) + '</textarea>';
    else if (f.type === 'select') ctrl = '<select class="form-select" id="fld-' + f.key + '">' + f.options.map(function (o) { return '<option value="' + esc(o) + '"' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    else if (f.type === 'check') ctrl = '<label class="toggle"><input type="checkbox" id="fld-' + f.key + '"' + (v ? ' checked' : '') + '><span class="track"></span></label>';
    else if (f.type === 'image') ctrl =
      '<div class="img-slot" style="aspect-ratio:16/9" onclick="editorUpload(\'' + f.key + '\',\'' + (f.folder || 'library') + '\')" id="slot-' + f.key + '">' +
      (v ? '<img class="fill" src="' + esc(v) + '" alt=""><div class="replace-hint">Click to replace</div>' : '<span>Click to upload image</span>') +
      '</div><input type="hidden" id="fld-' + f.key + '" value="' + esc(v) + '">';
    else ctrl = '<input class="form-input" id="fld-' + f.key + '" type="' + (f.type || 'text') + '" value="' + esc(v) + '" placeholder="' + esc(f.placeholder || '') + '">';
    return '<div class="form-group"' + (f.half ? ' data-half' : '') + '><label class="form-label">' + esc(f.label) +
      (f.hint ? ' <span class="form-hint">— ' + esc(f.hint) + '</span>' : '') + '</label>' + ctrl + '</div>';
  }).join('');
  document.getElementById('editor-body').innerHTML =
    '<div class="form-grid-2" style="grid-template-columns:1fr 1fr">' +
    body.replace(/<div class="form-group"(?! data-half)/g, '</div><div style="grid-column:1/-1" class="form-group"').replace(/^<\/div>/, '') +
    '</div>';
  document.getElementById('editor-modal').classList.add('open');
}
async function editorUpload(key, folder) {
  try {
    toast('Uploading…');
    const url = await DB.pickAndUpload(folder);
    if (!url) return;
    document.getElementById('fld-' + key).value = url;
    document.getElementById('slot-' + key).innerHTML = '<img class="fill" src="' + esc(url) + '" alt=""><div class="replace-hint">Click to replace</div>';
    toast('Image uploaded');
  } catch (e) { fail(e); }
}
function closeEditor() { document.getElementById('editor-modal').classList.remove('open'); }
async function saveEditor() {
  const out = {};
  editorCtx.fields.forEach(function (f) {
    const el = document.getElementById('fld-' + f.key);
    out[f.key] = f.type === 'check' ? el.checked : el.value;
  });
  try { await editorCtx.onSave(out); closeEditor(); }
  catch (e) { fail(e); }
}

// =====================================================================
const VIEWS = {

// ---------------- DASHBOARD ----------------
dashboard: () => safe(async function () {
  const [events, sermons, team, log] = await Promise.all([
    DB.list('events', { order: [['starts_at', 'asc']] }),
    DB.list('sermons', { limit: 200 }),
    DB.list('team_members', { limit: 200 }),
    DB.canManageUsers() ? DB.list('audit_log', { order: [['created_at', 'desc']], limit: 8 }) : Promise.resolve([]),
  ]);
  const upcoming = events.filter(function (e) { return e.starts_at >= new Date().toISOString().slice(0, 10); });
  return '<div class="stat-row">' +
    '<div class="stat-card accent"><div class="stat-label">Next event</div><div class="stat-value" style="font-size:1.3rem">' + (upcoming[0] ? esc(upcoming[0].title) : '—') + '</div><div class="stat-note">' + (upcoming[0] ? fmtDate(upcoming[0].starts_at) : 'No upcoming events yet') + '</div></div>' +
    '<div class="stat-card"><div class="stat-label">Upcoming events</div><div class="stat-value">' + upcoming.length + '</div><div class="stat-note">' + events.length + ' total</div></div>' +
    '<div class="stat-card"><div class="stat-label">Sermons</div><div class="stat-value">' + sermons.length + '</div><div class="stat-note">' + sermons.filter(function (s) { return !s.manual; }).length + ' from YouTube sync</div></div>' +
    '<div class="stat-card"><div class="stat-label">Team profiles</div><div class="stat-value">' + team.length + '</div><div class="stat-note">' + team.filter(function (t) { return t.published; }).length + ' published</div></div>' +
    '</div>' +
    '<div class="panel" style="margin-bottom:18px"><div class="panel-head"><div><h3>Quick actions</h3></div></div>' +
    '<div class="panel-body" style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-primary" onclick="addEvent()">+ Add Event</button>' +
    (DB.isEventsOnly() ? '' :
      '<button class="btn btn-outline" onclick="go(\'pages\')">Edit Pages</button>' +
      '<button class="btn btn-outline" onclick="addTeamMember()">+ Team Member</button>' +
      '<button class="btn btn-outline" onclick="addSermon()">+ Sermon</button>') +
    '</div></div>' +
    (log.length ? '<div class="panel"><div class="panel-head"><div><h3>Recent activity</h3></div></div><div class="data-list">' +
      log.map(function (l) {
        return '<div class="data-row"><div class="avatar">' + esc((l.actor_name || '?').slice(0, 2).toUpperCase()) + '</div>' +
          '<div class="row-main"><div class="row-title" style="font-weight:500">' + esc(l.actor_name || 'Unknown') + ' · ' + esc(l.action) + '</div>' +
          '<div class="row-sub">' + esc(l.detail || '') + ' · ' + new Date(l.created_at).toLocaleString() + '</div></div></div>';
      }).join('') + '</div></div>' : '');
}),

// ---------------- PAGES ----------------
pages: () => safe(async function () {
  const pages = await DB.list('pages', { order: [['slug', 'asc']] });
  return '<div class="panel"><div class="panel-head"><div><h3>Site pages</h3><div class="sub">Edit each page\u2019s text, images and SEO</div></div></div><div class="data-list">' +
    pages.map(function (p) {
      return '<div class="data-row"><div class="row-thumb-sq" style="display:grid;place-items:center;color:var(--gray-2)">' + ICONS.pages + '</div>' +
        '<div class="row-main"><div class="row-title">' + esc(p.title) + '</div><div class="row-sub">/website' + (p.slug === 'index' ? '' : '/' + esc(p.slug)) + '</div></div>' +
        '<span class="tag ' + (p.published ? 'tag-green' : 'tag-gray') + '" style="margin-right:8px">' + (p.published ? 'Published' : 'Hidden') + '</span>' +
        '<button class="btn btn-sm btn-outline" onclick="editPage(\'' + p.id + '\')">Fields</button>' +
        '<a class="btn btn-sm btn-primary" href="/website' + (p.slug === 'index' ? '' : '/' + encodeURIComponent(p.slug)) + '?edit=1" target="_blank">Visual edit ↗</a></div>';
    }).join('') + '</div></div>';
}),

// ---------------- SERMONS ----------------
sermons: () => safe(async function () {
  const [settings, sermons] = await Promise.all([
    DB.getSettings(),
    DB.list('sermons', { order: [['published_at', 'desc']] }),
  ]);
  return '<div class="panel" style="margin-bottom:16px"><div class="panel-body" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
    '<div style="width:42px;height:42px;border-radius:var(--radius-sm);background:#FF0000;display:grid;place-items:center;flex-shrink:0"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M10 9l5 3-5 3z"/></svg></div>' +
    '<div style="flex:1;min-width:220px"><div style="font-weight:700;font-size:.9rem">YouTube channel</div>' +
    '<input class="form-input" id="yt-channel" style="margin-top:6px" placeholder="e.g. https://youtube.com/@OasisChristianCentre" value="' + esc(settings.youtube_channel || '') + '"></div>' +
    '<button class="btn btn-sm btn-primary" onclick="saveYtChannel()">Save</button></div>' +
    '<div class="panel-body" style="border-top:1px solid var(--border);font-size:.78rem;color:var(--gray-1)">Automatic sync requires the YouTube sync Edge Function (see SUPABASE-GUIDE.md). Until it\u2019s deployed, add videos below — paste any YouTube link.</div></div>' +
    '<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn btn-primary" onclick="addSermon()">+ Add Sermon</button></div>' +
    '<div class="panel"><div class="panel-head"><div><h3>Sermons (' + sermons.length + ')</h3><div class="sub">Newest first · hidden sermons don\u2019t show on the site</div></div></div><div class="data-list">' +
    (sermons.length ? sermons.map(function (s) {
      return '<div class="data-row" style="' + (s.hidden ? 'opacity:.5' : '') + '">' +
        '<img class="row-thumb" src="' + esc(s.thumbnail_url || ('https://i.ytimg.com/vi/' + s.youtube_id + '/mqdefault.jpg')) + '" alt="">' +
        '<div class="row-main"><div class="row-title">' + esc(s.title) + '</div>' +
        '<div class="row-sub">' + esc([s.series, s.speaker, fmtDate(s.published_at && s.published_at.slice(0, 10))].filter(Boolean).join(' · ')) + (s.manual ? '' : ' · synced') + '</div></div>' +
        (s.featured ? '<span class="tag tag-amber" style="flex-shrink:0">Featured</span>' : '') +
        (s.hidden ? '<span class="tag tag-gray" style="flex-shrink:0">Hidden</span>' : '') +
        '<div class="row-actions">' +
        '<button class="icon-btn" title="Edit" onclick="editSermon(\'' + s.id + '\')">' + ICONS.edit + '</button>' +
        '<button class="icon-btn" title="Delete" onclick="confirmAction(\'Delete sermon <strong>' + esc(s.title).replace(/'/g, '&#39;') + '</strong>? This does not affect YouTube.\', function(){delSermon(\'' + s.id + '\')})">' + ICONS.trash + '</button>' +
        '</div></div>';
    }).join('') : '<div class="data-row"><div class="row-main" style="color:var(--gray-1)">No sermons yet — click “+ Add Sermon” and paste a YouTube link.</div></div>') +
    '</div></div>';
}),

// ---------------- EVENTS ----------------
events: () => safe(async function () {
  const events = await DB.list('events', { order: [['sort_order', 'asc'], ['starts_at', 'asc']] });
  return '<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn btn-primary" onclick="addEvent()">+ Add Event</button></div>' +
    '<div class="panel"><div class="panel-head"><div><h3>Events (' + events.length + ')</h3><div class="sub">Use ↑↓ to reorder · unpublished events are hidden from the site</div></div></div><div class="data-list">' +
    (events.length ? events.map(function (e, i) {
      const d = e.starts_at ? new Date(e.starts_at + 'T12:00:00') : null;
      return '<div class="data-row" style="' + (e.published ? '' : 'opacity:.5') + '">' +
        '<div style="display:flex;flex-direction:column;flex-shrink:0">' +
        '<button class="icon-btn" style="padding:2px" ' + (i === 0 ? 'disabled' : '') + ' onclick="moveRow(\'events\',\'' + e.id + '\',-1,\'events\')">' + ICONS.up + '</button>' +
        '<button class="icon-btn" style="padding:2px" ' + (i === events.length - 1 ? 'disabled' : '') + ' onclick="moveRow(\'events\',\'' + e.id + '\',1,\'events\')">' + ICONS.down + '</button></div>' +
        (d ? '<div class="date-chip"><div class="m">' + d.toLocaleString('en-US', { month: 'short' }) + '</div><div class="d">' + d.getDate() + '</div></div>' : '') +
        '<div class="row-main"><div class="row-title">' + esc(e.title) + '</div>' +
        '<div class="row-sub">' + esc([e.time_label, e.location, e.category].filter(Boolean).join(' · ')) + '</div></div>' +
        (e.featured ? '<span class="tag tag-amber" style="flex-shrink:0">Featured</span>' : '') +
        '<span class="tag ' + (e.published ? 'tag-green' : 'tag-gray') + '" style="flex-shrink:0">' + (e.published ? 'Published' : 'Draft') + '</span>' +
        '<div class="row-actions">' +
        '<button class="icon-btn" title="Edit" onclick="editEvent(\'' + e.id + '\')">' + ICONS.edit + '</button>' +
        '<button class="icon-btn" title="Delete" onclick="confirmAction(\'Delete event <strong>' + esc(e.title).replace(/'/g, '&#39;') + '</strong>?\', function(){delEvent(\'' + e.id + '\')})">' + ICONS.trash + '</button>' +
        '</div></div>';
    }).join('') : '<div class="data-row"><div class="row-main" style="color:var(--gray-1)">No events yet — click “+ Add Event”.</div></div>') +
    '</div></div>';
}),

// ---------------- TEAM ----------------
team: () => safe(async function () {
  const team = await DB.list('team_members', { order: [['sort_order', 'asc']] });
  return '<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn btn-primary" onclick="addTeamMember()">+ Add Team Member</button></div>' +
    '<div class="panel"><div class="panel-head"><div><h3>Leadership team (' + team.length + ')</h3><div class="sub">Use ↑↓ to reorder · appears on the Leadership page in this order</div></div></div><div class="data-list">' +
    (team.length ? team.map(function (t, i) {
      return '<div class="data-row" style="' + (t.published ? '' : 'opacity:.5') + '">' +
        '<div style="display:flex;flex-direction:column;flex-shrink:0">' +
        '<button class="icon-btn" style="padding:2px" ' + (i === 0 ? 'disabled' : '') + ' onclick="moveRow(\'team_members\',\'' + t.id + '\',-1,\'team\')">' + ICONS.up + '</button>' +
        '<button class="icon-btn" style="padding:2px" ' + (i === team.length - 1 ? 'disabled' : '') + ' onclick="moveRow(\'team_members\',\'' + t.id + '\',1,\'team\')">' + ICONS.down + '</button></div>' +
        (t.photo_url ? '<img class="row-thumb-sq" src="' + esc(t.photo_url) + '" alt="">' : '<div class="avatar">' + esc(t.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('')) + '</div>') +
        '<div class="row-main"><div class="row-title">' + esc(t.name) + '</div><div class="row-sub">' + esc(t.role_title) + ' · ' + esc(t.grouping) + '</div></div>' +
        '<span class="tag ' + (t.published ? 'tag-green' : 'tag-gray') + '" style="flex-shrink:0">' + (t.published ? 'Published' : 'Hidden') + '</span>' +
        '<div class="row-actions">' +
        '<button class="icon-btn" title="Edit" onclick="editTeamMember(\'' + t.id + '\')">' + ICONS.edit + '</button>' +
        '<button class="icon-btn" title="Delete" onclick="confirmAction(\'Remove <strong>' + esc(t.name).replace(/'/g, '&#39;') + '</strong> from the Leadership page?\', function(){delTeamMember(\'' + t.id + '\')})">' + ICONS.trash + '</button>' +
        '</div></div>';
    }).join('') : '<div class="data-row"><div class="row-main" style="color:var(--gray-1)">No team members yet — the Leadership page is empty until you add them here.</div></div>') +
    '</div></div>';
}),

// ---------------- EXTERNAL GIVING LINK ----------------
give: () => safe(async function () {
  const s = await DB.getSettings();
  return '<div class="panel"><div class="panel-head"><div><h3>External giving link</h3><div class="sub">The website does not process gifts; every “Give” button opens this external provider</div></div>' +
    '<button class="btn btn-sm btn-primary" onclick="saveGive()">Save</button></div>' +
    '<div class="panel-body">' +
    '<div class="form-group"><label class="form-label">External provider URL</label>' +
    '<input class="form-input" id="give-url" value="' + esc(s.donate_url || '') + '"></div>' +
    '<div class="form-group" style="flex-direction:row;align-items:center;gap:10px;margin-bottom:0">' +
    '<label class="toggle"><input type="checkbox" id="give-newtab"' + (s.donate_new_tab ? ' checked' : '') + '><span class="track"></span></label>' +
    '<span style="font-size:.84rem">Open in a new tab</span>' +
    '<a class="btn btn-sm btn-outline" style="margin-left:auto" href="' + esc(s.donate_url || '#') + '" target="_blank" rel="noopener">Test Link ↗</a>' +
    '</div></div></div>';
}),

// ---------------- NAVIGATION & FOOTER ----------------
navigation: () => safe(async function () {
  const [items, s] = await Promise.all([
    DB.list('nav_items', { order: [['sort_order', 'asc']], eq: { area: 'main' } }),
    DB.getSettings(),
  ]);
  return '<div class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h3>Main navigation</h3><div class="sub">↑↓ to reorder · toggle to show/hide</div></div>' +
    '<button class="btn btn-sm btn-primary" onclick="addNavItem()">+ Add Link</button></div><div class="data-list">' +
    items.map(function (n, i) {
      return '<div class="data-row">' +
        '<div style="display:flex;flex-direction:column;flex-shrink:0">' +
        '<button class="icon-btn" style="padding:2px" ' + (i === 0 ? 'disabled' : '') + ' onclick="moveRow(\'nav_items\',\'' + n.id + '\',-1,\'navigation\',{area:\'main\'})">' + ICONS.up + '</button>' +
        '<button class="icon-btn" style="padding:2px" ' + (i === items.length - 1 ? 'disabled' : '') + ' onclick="moveRow(\'nav_items\',\'' + n.id + '\',1,\'navigation\',{area:\'main\'})">' + ICONS.down + '</button></div>' +
        '<div class="row-main"><div class="row-title" style="font-weight:500">' + esc(n.label) + '</div><div class="row-sub">' + esc(n.href) + '</div></div>' +
        '<label class="toggle" title="Show/hide"><input type="checkbox"' + (n.visible ? ' checked' : '') + ' onchange="toggleNav(\'' + n.id + '\', this.checked)"><span class="track"></span></label>' +
        '<div class="row-actions">' +
        '<button class="icon-btn" onclick="editNavItem(\'' + n.id + '\')">' + ICONS.edit + '</button>' +
        '<button class="icon-btn" onclick="confirmAction(\'Remove the <strong>' + esc(n.label) + '</strong> link from the menu?\', function(){delNavItem(\'' + n.id + '\')})">' + ICONS.trash + '</button>' +
        '</div></div>';
    }).join('') + '</div></div>' +
    '<div class="panel"><div class="panel-head"><div><h3>Site info & footer</h3></div>' +
    '<button class="btn btn-sm btn-primary" onclick="saveSiteInfo()">Save</button></div><div class="panel-body">' +
    '<div class="form-group"><label class="form-label">Tagline</label><input class="form-input" id="si-tagline" value="' + esc(s.tagline || '') + '"></div>' +
    '<div class="form-grid-2">' +
    '<div class="form-group"><label class="form-label">Address</label><input class="form-input" id="si-address" value="' + esc(s.address || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="si-phone" value="' + esc(s.phone || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Email</label><input class="form-input" id="si-email" value="' + esc(s.email || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Service time</label><input class="form-input" id="si-service" value="' + esc(s.service_time || '') + '"></div>' +
    '<div style="grid-column:1/-1;padding:12px 0 2px"><h4 style="margin:0 0 4px">Social icons</h4><div class="sub">Enter the complete https:// URL. Facebook and Instagram icons appear in the desktop navigation, mobile menu, and footer after you save.</div></div>' +
    '<div class="form-group"><label class="form-label">Instagram URL</label><input class="form-input" id="si-instagram" placeholder="https://instagram.com/your-page" value="' + esc(s.instagram || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Facebook URL</label><input class="form-input" id="si-facebook" placeholder="https://facebook.com/your-page" value="' + esc(s.facebook || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">YouTube URL</label><input class="form-input" id="si-youtube" value="' + esc(s.youtube || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Public calendar URL</label><input class="form-input" id="si-calendar" value="' + esc(s.calendar_url || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Apple Podcasts URL</label><input class="form-input" id="si-podcast-apple" value="' + esc(s.podcast_apple_url || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Spotify Podcast URL</label><input class="form-input" id="si-podcast-spotify" value="' + esc(s.podcast_spotify_url || '') + '"></div>' +
    '</div>' +
    '<div class="form-group" style="margin-bottom:0;display:flex;align-items:center;gap:10px;margin-top:8px">' +
    '<label class="toggle" title="Show/hide podcast section on Watch page"><input type="checkbox" id="si-podcast"' + (s.podcast_enabled ? ' checked' : '') + '><span class="track"></span></label>' +
    '<label class="form-label" style="margin:0">Show &ldquo;Subscribe to the Oasis Podcast&rdquo; section on the Watch page</label>' +
    '</div>' +
    '</div></div>' +
    '<div class="panel" style="margin-top:16px"><div class="panel-head"><div><h3>Live player</h3><div class="sub">Restream pushes to all — set which tab is shown by default</div></div>' +
    '<button class="btn btn-sm btn-primary" onclick="saveSiteInfo()">Save</button></div><div class="panel-body">' +
    '<div class="form-group"><label class="form-label">Default tab</label>' +
    '<select class="form-input" id="si-live-tab">' +
    '<option value="twitch"'   + (s.live_default_tab === 'twitch'   || !s.live_default_tab ? ' selected' : '') + '>Twitch</option>' +
    '<option value="youtube"'  + (s.live_default_tab === 'youtube'  ? ' selected' : '') + '>YouTube Live</option>' +
    '<option value="facebook"' + (s.live_default_tab === 'facebook' ? ' selected' : '') + '>Facebook Live</option>' +
    '</select></div>' +
    '<div class="form-grid-2">' +
    '<div class="form-group"><label class="form-label">Twitch channel</label><input class="form-input" id="si-twitch" placeholder="occnj" value="' + esc(s.twitch_channel || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">YouTube channel ID</label><input class="form-input" id="si-yt-channel" placeholder="UCR4FqPSfjQAGy6jZB7OJ76w" value="' + esc(s.youtube_channel || '') + '"><div class="sub" style="margin-top:4px">Channel ID or a specific live video ID (11 chars)</div></div>' +
    '<div class="form-group"><label class="form-label">Facebook page username / ID</label><input class="form-input" id="si-fb-page" placeholder="OasisChristianCentreNJ" value="' + esc(s.facebook_page_id || '') + '"></div>' +
    '</div></div></div>';
}),

// Settings keeps the site-info and live-player controls available from a
// clearly named admin destination; navigation remains available separately.
settings: () => safe(async function () {
  if (!DB.canManageUsers()) return needSetup('Only administrators can manage form delivery settings.');
  const s = await DB.getFormSettings();
  return '<div class="panel"><div class="panel-head"><div><h3>Form email delivery</h3><div class="sub">Admin-only · controls where confidential submissions are delivered</div></div>' +
    '<button class="btn btn-sm btn-primary" onclick="saveFormRecipients()">Save</button></div><div class="panel-body">' +
    '<div class="form-group"><label class="form-label">Prayer request recipients</label><textarea class="form-textarea" id="form-prayer-recipients" placeholder="pastor@example.com, prayer@example.com">' + esc(s.prayer_recipients || '') + '</textarea><div class="sub" style="margin-top:4px">Comma-, space-, or line-separated addresses</div></div>' +
    '<div class="form-group"><label class="form-label">Regular form recipients</label><textarea class="form-textarea" id="form-regular-recipients" placeholder="office@example.com">' + esc(s.form_recipients || '') + '</textarea><div class="sub" style="margin-top:4px">Contact, baptism, dedication, and other non-prayer forms</div></div>' +
    '</div></div>';
}),

// ---------------- MEDIA ----------------
media: () => safe(async function () {
  const folders = ['heroes', 'team', 'events', 'library'];
  const all = [];
  for (const f of folders) {
    const { data } = await DB.client.storage.from('media').list(f, { limit: 60, sortBy: { column: 'created_at', order: 'desc' } });
    (data || []).forEach(function (o) { if (o.name !== '.emptyFolderPlaceholder') all.push({ folder: f, name: o.name }); });
  }
  return '<div class="panel"><div class="panel-head"><div><h3>Media library</h3><div class="sub">Supabase Storage · ' + all.length + ' files</div></div>' +
    '<button class="btn btn-sm btn-primary" onclick="uploadMedia()">↑ Upload</button></div><div class="panel-body">' +
    (all.length ? '<div class="media-grid">' + all.map(function (o) {
      const url = DB.client.storage.from('media').getPublicUrl(o.folder + '/' + o.name).data.publicUrl;
      return '<div class="media-item"><div class="thumb" onclick="copyUrl(\'' + url + '\')" title="Click to copy URL"><img src="' + url + '" alt="" loading="lazy"></div>' +
        '<div class="meta" style="display:flex;align-items:center;gap:6px"><span style="flex:1;overflow:hidden;text-overflow:ellipsis">' + esc(o.name) + '</span>' +
        '<button class="icon-btn" style="padding:3px" onclick="confirmAction(\'Delete <strong>' + esc(o.name) + '</strong>? Pages using it will show a broken image.\', function(){delMedia(\'' + o.folder + '/' + o.name + '\')})">' + ICONS.trash + '</button></div></div>';
    }).join('') + '</div>' : '<div style="color:var(--gray-1);font-size:.85rem">No files yet. Upload images here, then use them across the site.</div>') +
    '</div></div>';
}),

// ---------------- USERS ----------------
users: () => safe(async function () {
  if (!DB.canManageUsers()) return needSetup('Only administrators can manage users.');
  const [users, log] = await Promise.all([
    DB.list('profiles', { order: [['created_at', 'asc']] }),
    DB.list('audit_log', { order: [['created_at', 'desc']], limit: 15 }),
  ]);
  return '<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><button class="btn btn-primary" onclick="addUser()">+ Add User</button></div>' +
    '<div class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h3>Team access (' + users.length + ')</h3><div class="sub">Suspend = keeps the account but blocks all access · Delete = revokes permanently</div></div></div><div class="data-list">' +
    users.map(function (u) {
      const isOwner = u.role === 'owner';
      const self = DB.me && u.id === DB.me.id;
      return '<div class="data-row" style="' + (u.active ? '' : 'opacity:.5') + '">' +
        '<div class="avatar ' + (isOwner ? 'amber' : '') + '">' + esc((u.full_name || '?').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase()) + '</div>' +
        '<div class="row-main"><div class="row-title">' + esc(u.full_name || u.id.slice(0, 8)) + (self ? ' <span class="tag tag-blue">You</span>' : '') + (isOwner ? ' <span class="tag tag-amber">Owner</span>' : '') + '</div>' +
        '<div class="row-sub">' + (u.active ? esc(u.role) : 'Suspended') + '</div></div>' +
        (isOwner
          ? '<span style="font-size:.72rem;color:var(--gray-1);flex-shrink:0">Protected account</span>'
          : '<select class="form-select" style="width:auto;padding:6px 10px;font-size:.78rem" onchange="setRole(\'' + u.id + '\', this.value)">' +
            ['admin', 'editor', 'events_only'].map(function (r) { return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>' +
            '<button class="btn btn-sm btn-outline" onclick="setActive(\'' + u.id + '\', ' + !u.active + ', \'' + esc(u.full_name || '') + '\')">' + (u.active ? 'Suspend' : 'Reactivate') + '</button>' +
            '<button class="icon-btn" title="Delete access" onclick="confirmAction(\'Permanently revoke access for <strong>' + esc(u.full_name || 'this user') + '</strong>? They will be signed out and can no longer log in to the admin.\', function(){delUser(\'' + u.id + '\',\'' + esc(u.full_name || '') + '\')})">' + ICONS.trash + '</button>') +
        '</div>';
    }).join('') + '</div></div>' +
    '<div class="panel"><div class="panel-head"><div><h3>Activity log</h3><div class="sub">All access and content changes</div></div></div><div class="data-list">' +
    (log.length ? log.map(function (l) {
      return '<div class="data-row"><div class="row-main"><div class="row-title" style="font-weight:500">' + esc(l.action) + ' · ' + esc(l.actor_name || '') + '</div>' +
        '<div class="row-sub">' + esc(l.detail || '') + ' · ' + new Date(l.created_at).toLocaleString() + '</div></div></div>';
    }).join('') : '<div class="data-row"><div class="row-main" style="color:var(--gray-1)">No activity yet.</div></div>') +
    '</div></div>';
}),
};

window.VIEWS = VIEWS;
window.ICONS = ICONS;
