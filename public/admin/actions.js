// Oasis Admin — CRUD actions (uses editor modal from views.js)

// ---------- EVENTS ----------
const EVENT_FIELDS = [
  { key: 'title', label: 'Event title' },
  { key: 'image', label: 'Event image', type: 'image', folder: 'events' },
  { key: 'starts_at', label: 'Date', type: 'date', half: true },
  { key: 'time_label', label: 'Time', placeholder: '7:00 PM', half: true },
  { key: 'location', label: 'Location', placeholder: 'Main Auditorium', half: true },
  { key: 'category', label: 'Category', type: 'select', options: ['worship', 'women', 'youth', 'community', 'family'], half: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'registration_url', label: 'Registration link', hint: 'optional', placeholder: 'https://…' },
  { key: 'featured', label: 'Feature on home page', type: 'check', half: true },
  { key: 'published', label: 'Published (visible on site)', type: 'check', default: true, half: true },
];
function eventRowFrom(out, id) {
  return { id: id || undefined, title: out.title, starts_at: out.starts_at || null, time_label: out.time_label,
    location: out.location, category: out.category, description: out.description,
    registration_url: out.registration_url, image_url: out.image, featured: out.featured, published: out.published };
}
function addEvent() {
  openEditor('Add event', EVENT_FIELDS, {}, async function (out) {
    if (!out.title || !out.starts_at) throw new Error('Title and date are required');
    await DB.save('events', eventRowFrom(out), 'event.create', out.title);
    toast('Event saved'); go('events');
  });
}
async function editEvent(id) {
  const e = (await DB.list('events', { eq: { id: id } }))[0];
  e.image = e.image_url;
  openEditor('Edit event', EVENT_FIELDS, e, async function (out) {
    await DB.save('events', eventRowFrom(out, id), 'event.update', out.title);
    toast('Event updated'); go('events');
  });
}
async function delEvent(id) {
  try { await DB.del('events', id, 'event.delete', id); toast('Event deleted'); go('events'); }
  catch (e) { fail(e); }
}

// ---------- SERMONS ----------
const SERMON_FIELDS = [
  { key: 'youtube_url', label: 'YouTube link or video ID', placeholder: 'https://youtube.com/watch?v=…' },
  { key: 'title', label: 'Title', hint: 'as it should appear on the site' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'series', label: 'Series', half: true, placeholder: 'e.g. Anchored' },
  { key: 'speaker', label: 'Speaker', half: true },
  { key: 'published_date', label: 'Date', type: 'date', half: true },
  { key: 'featured', label: 'Featured (latest message)', type: 'check', half: true },
  { key: 'hidden', label: 'Hidden from site', type: 'check', half: true },
];
function sermonRowFrom(out, id) {
  const ytid = ytIdFrom(out.youtube_url);
  if (!ytid) throw new Error('Could not read a YouTube video ID from that link');
  if (!out.title) throw new Error('Title is required');
  return { id: id || undefined, youtube_id: ytid, title: out.title, description: out.description,
    series: out.series, speaker: out.speaker, featured: out.featured, hidden: out.hidden,
    published_at: out.published_date ? out.published_date + 'T12:00:00Z' : new Date().toISOString(),
    thumbnail_url: 'https://i.ytimg.com/vi/' + ytid + '/hqdefault.jpg', manual: true };
}
function addSermon() {
  openEditor('Add sermon', SERMON_FIELDS, {}, async function (out) {
    await DB.save('sermons', sermonRowFrom(out), 'sermon.create', out.title);
    toast('Sermon added'); go('sermons');
  });
}
async function editSermon(id) {
  const s = (await DB.list('sermons', { eq: { id: id } }))[0];
  s.youtube_url = s.youtube_id;
  s.published_date = s.published_at ? s.published_at.slice(0, 10) : '';
  openEditor('Edit sermon', SERMON_FIELDS, s, async function (out) {
    const row = sermonRowFrom(out, id);
    row.manual = s.manual;
    await DB.save('sermons', row, 'sermon.update', out.title);
    toast('Sermon updated'); go('sermons');
  });
}
async function delSermon(id) {
  try { await DB.del('sermons', id, 'sermon.delete', id); toast('Sermon removed'); go('sermons'); }
  catch (e) { fail(e); }
}
async function saveYtChannel() {
  try {
    await DB.saveSettings({ youtube_channel: document.getElementById('yt-channel').value.trim() }, 'settings.youtube_channel');
    toast('YouTube channel saved');
  } catch (e) { fail(e); }
}

// ---------- TEAM ----------
const TEAM_FIELDS = [
  { key: 'photo', label: 'Profile photo', type: 'image', folder: 'team' },
  { key: 'name', label: 'Full name', half: true },
  { key: 'role_title', label: 'Position / title', half: true, placeholder: 'e.g. Lead Pastor' },
  { key: 'grouping', label: 'Section', type: 'select', options: ['Senior Leadership', 'Pastoral Team', 'Ministry Leaders', 'Staff'], half: true },
  { key: 'published', label: 'Published (visible on site)', type: 'check', default: true, half: true },
  { key: 'bio', label: 'Biography', type: 'textarea' },
  { key: 'link_instagram', label: 'Instagram', half: true, hint: 'optional' },
  { key: 'link_facebook', label: 'Facebook', half: true, hint: 'optional' },
  { key: 'link_email', label: 'Contact email', half: true, hint: 'optional' },
];
function teamRowFrom(out, id) {
  if (!out.name || !out.role_title) throw new Error('Name and position are required');
  return { id: id || undefined, name: out.name, role_title: out.role_title, grouping: out.grouping,
    bio: out.bio, photo_url: out.photo, published: out.published,
    links: { instagram: out.link_instagram || '', facebook: out.link_facebook || '', email: out.link_email || '' } };
}
function addTeamMember() {
  openEditor('Add team member', TEAM_FIELDS, {}, async function (out) {
    await DB.save('team_members', teamRowFrom(out), 'team.create', out.name);
    toast('Team member added'); go('team');
  });
}
async function editTeamMember(id) {
  const t = (await DB.list('team_members', { eq: { id: id } }))[0];
  t.photo = t.photo_url;
  const L = t.links || {};
  t.link_instagram = L.instagram; t.link_facebook = L.facebook; t.link_email = L.email;
  openEditor('Edit team member', TEAM_FIELDS, t, async function (out) {
    await DB.save('team_members', teamRowFrom(out, id), 'team.update', out.name);
    toast('Saved'); go('team');
  });
}
async function delTeamMember(id) {
  try { await DB.del('team_members', id, 'team.delete', id); toast('Removed'); go('team'); }
  catch (e) { fail(e); }
}

// ---------- GIVING ----------
async function saveGive() {
  try {
    const donateUrl = document.getElementById('give-url').value.trim();
    if (!/^https:\/\//i.test(donateUrl)) throw new Error('External giving link must begin with https://');
    await DB.saveSettings({
      donate_url: donateUrl,
      donate_new_tab: document.getElementById('give-newtab').checked,
    }, 'settings.donate');
    toast('Donation link saved — live site-wide');
  } catch (e) { fail(e); }
}

// ---------- NAVIGATION / SITE INFO ----------
const NAV_FIELDS = [
  { key: 'label', label: 'Label', half: true },
  { key: 'href', label: 'Link', half: true, placeholder: '/about or https://…' },
];
function addNavItem() {
  openEditor('Add navigation link', NAV_FIELDS, {}, async function (out) {
    if (!out.label || !out.href) throw new Error('Label and link are required');
    await DB.save('nav_items', { label: out.label, href: out.href, sort_order: 99, area: 'main' }, 'nav.create', out.label);
    toast('Link added'); go('navigation');
  });
}
async function editNavItem(id) {
  const n = (await DB.list('nav_items', { eq: { id: id } }))[0];
  openEditor('Edit navigation link', NAV_FIELDS, n, async function (out) {
    await DB.save('nav_items', { id: id, label: out.label, href: out.href }, 'nav.update', out.label);
    toast('Saved'); go('navigation');
  });
}
async function delNavItem(id) {
  try { await DB.del('nav_items', id, 'nav.delete', id); toast('Link removed'); go('navigation'); }
  catch (e) { fail(e); }
}
async function toggleNav(id, visible) {
  try { await DB.save('nav_items', { id: id, visible: visible }, 'nav.toggle', visible ? 'shown' : 'hidden'); toast(visible ? 'Link shown' : 'Link hidden'); }
  catch (e) { fail(e); }
}
async function saveSiteInfo() {
  try {
    await DB.saveSettings({
      tagline: document.getElementById('si-tagline').value,
      address: document.getElementById('si-address').value,
      phone: document.getElementById('si-phone').value,
      email: document.getElementById('si-email').value,
      service_time: document.getElementById('si-service').value,
      instagram: document.getElementById('si-instagram').value,
      facebook: document.getElementById('si-facebook').value,
      youtube: document.getElementById('si-youtube').value,
      calendar_url: document.getElementById('si-calendar').value,
      podcast_apple_url: document.getElementById('si-podcast-apple').value,
      podcast_spotify_url: document.getElementById('si-podcast-spotify').value,
      podcast_enabled: document.getElementById('si-podcast').checked,
      twitch_channel: document.getElementById('si-twitch').value,
      youtube_channel: document.getElementById('si-yt-channel').value,
      facebook_page_id: document.getElementById('si-fb-page').value,
      live_default_tab: document.getElementById('si-live-tab').value,
    }, 'settings.site_info');
    toast('Site info saved');
  } catch (e) { fail(e); }
}

async function saveFormRecipients() {
  try {
    await DB.saveFormSettings({
      prayer_recipients: document.getElementById('form-prayer-recipients').value.trim(),
      form_recipients: document.getElementById('form-regular-recipients').value.trim(),
    });
    toast('Form recipients saved');
  } catch (e) { fail(e); }
}

// ---------- MEDIA ----------
async function uploadMedia() {
  try {
    toast('Choose a file…');
    const url = await DB.pickAndUpload('library');
    if (url) { DB.audit('media.upload', url.split('/').pop()); toast('Uploaded'); go('media'); }
  } catch (e) { fail(e); }
}
async function delMedia(path) {
  try {
    const { error } = await DB.client.storage.from('media').remove([path]);
    if (error) throw error;
    DB.audit('media.delete', path);
    toast('File deleted'); go('media');
  } catch (e) { fail(e); }
}
function copyUrl(url) {
  navigator.clipboard.writeText(url).then(function () { toast('Image URL copied'); });
}

// ---------- USERS ----------
function addUser() {
  openEditor('Add user', [
    { key: 'note', label: 'Step 1 — create the login', hint: 'Supabase Dashboard → Authentication → Users → Add user (set their email + temp password, Auto Confirm ON). Then paste their User ID below.', type: 'textarea', default: '' },
    { key: 'user_id', label: 'User ID (UUID from the dashboard)' },
    { key: 'full_name', label: 'Full name', half: true },
    { key: 'role', label: 'Role', type: 'select', options: ['editor', 'admin', 'events_only'], half: true },
  ], {}, async function (out) {
    if (!/^[0-9a-f-]{36}$/i.test(out.user_id.trim())) throw new Error('That does not look like a valid User ID');
    const { error } = await DB.client.from('profiles').insert({ id: out.user_id.trim(), full_name: out.full_name, role: out.role });
    if (error) throw error;
    DB.audit('user.add', out.full_name + ' (' + out.role + ')');
    toast('User added'); go('users');
  });
  // hide the fake textarea used as instructions
  const note = document.getElementById('fld-note');
  if (note) { note.style.display = 'none'; }
}
async function setRole(id, role) {
  try {
    const { error } = await DB.client.from('profiles').update({ role: role }).eq('id', id);
    if (error) throw error;
    DB.audit('user.role', id.slice(0, 8) + ' → ' + role);
    toast('Role updated');
  } catch (e) { fail(e); go('users'); }
}
async function setActive(id, active, name) {
  try {
    const { error } = await DB.client.from('profiles').update({ active: active }).eq('id', id);
    if (error) throw error;
    DB.audit(active ? 'user.reactivate' : 'user.suspend', name || id.slice(0, 8));
    toast(active ? 'User reactivated' : 'User suspended — access blocked immediately');
    go('users');
  } catch (e) { fail(e); }
}
async function delUser(id, name) {
  try {
    const { error } = await DB.client.from('profiles').delete().eq('id', id);
    if (error) throw error;
    DB.audit('user.delete', name || id.slice(0, 8));
    toast('Access permanently revoked');
    go('users');
  } catch (e) { fail(e); }
}

// ---------- PAGE EDITOR ----------
async function editPage(pageId) {
  const container = document.getElementById('view-container');
  container.innerHTML = '<div class="view active"><div class="panel"><div class="panel-body">Loading…</div></div></div>';
  try {
    const page = (await DB.list('pages', { eq: { id: pageId } }))[0];
    const blocks = await DB.list('page_blocks', { eq: { page_id: pageId }, order: [['sort_order', 'asc']] });
    // Every hero block gets a background-image slot, even if this page's
    // content JSON was seeded without one — keeps older pages in sync with
    // the newer image + overlay hero design.
    blocks.forEach(function (b) {
      if (b.block_key === 'hero' && !('image' in b.content)) {
        b.content = Object.assign({}, b.content, { image: '' });
      }
    });
    document.getElementById('topbar-title').textContent = 'Edit — ' + page.title;
    window.__pageCtx = { page: page, blocks: blocks };
    const blockHtml = blocks.map(function (b, bi) {
      const fields = Object.entries(b.content).map(function (kv) {
        const k = kv[0], v = kv[1];
        const fid = 'pb-' + bi + '-' + k;
        if (/image|photo/.test(k)) {
          const label = (b.block_key === 'hero' && k === 'image') ? 'Hero background image' : esc(k);
          const hint = (b.block_key === 'hero' && k === 'image') ? ' <span class="form-hint">— shown behind the color overlay</span>' : '';
          return '<div class="form-group"><label class="form-label">' + label + hint + '</label>' +
            '<div class="img-slot" style="aspect-ratio:21/9" id="slot-' + fid + '" onclick="pageImgUpload(\'' + fid + '\')">' +
            (v ? '<img class="fill" src="' + esc(v) + '" alt=""><div class="replace-hint">Click to replace</div>' : '<span>Click to upload image</span>') +
            '</div><input type="hidden" id="' + fid + '" value="' + esc(v) + '"></div>';
        }
        const long = String(v).length > 70;
        return '<div class="form-group"><label class="form-label" style="text-transform:capitalize">' + esc(k) + '</label>' +
          (long ? '<textarea class="form-textarea" id="' + fid + '">' + esc(v) + '</textarea>'
                : '<input class="form-input" id="' + fid + '" value="' + esc(v) + '">') + '</div>';
      }).join('');
      return '<div class="panel" style="margin-bottom:16px"><div class="panel-head"><div><h3 style="text-transform:capitalize">' + esc(b.block_key.replace(/_/g, ' ')) + '</h3></div>' +
        '<label class="toggle" title="Show/hide on site"><input type="checkbox" id="pb-' + bi + '-visible"' + (b.visible ? ' checked' : '') + '><span class="track"></span></label>' +
        '</div><div class="panel-body">' + (fields || '<span style="color:var(--gray-1);font-size:.85rem">No editable fields in this block.</span>') + '</div></div>';
    }).join('');
    container.innerHTML = '<div class="view active" data-screen-label="Page Editor">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
      '<button class="btn btn-sm btn-outline" onclick="go(\'pages\')">← All pages</button>' +
      '<span class="tag tag-blue">' + esc(page.title) + '</span>' +
      '<div style="margin-left:auto;display:flex;gap:8px">' +
      '<a class="btn btn-sm btn-outline" href="/website' + (page.slug === 'index' ? '' : '/' + esc(page.slug)) + '" target="_blank">Preview ↗</a>' +
      '<a class="btn btn-sm btn-primary" href="/website' + (page.slug === 'index' ? '' : '/' + encodeURIComponent(page.slug)) + '?edit=1" target="_blank">Visual edit ↗</a>' +
      '<button class="btn btn-sm btn-primary" onclick="savePage()">Publish Changes</button></div></div>' +
      blockHtml +
      '<div class="panel"><div class="panel-head"><div><h3>SEO</h3></div></div><div class="panel-body">' +
      '<div class="form-group"><label class="form-label">Page title</label><input class="form-input" id="seo-title" value="' + esc(page.seo_title || '') + '"></div>' +
      '<div class="form-group" style="margin-bottom:0"><label class="form-label">Description</label><textarea class="form-textarea" style="min-height:60px" id="seo-desc">' + esc(page.seo_description || '') + '</textarea></div>' +
      '</div></div></div>';
    window.scrollTo(0, 0);
  } catch (e) { fail(e); }
}
async function pageImgUpload(fid) {
  try {
    toast('Uploading…');
    const url = await DB.pickAndUpload('heroes');
    if (!url) return;
    document.getElementById(fid).value = url;
    document.getElementById('slot-' + fid).innerHTML = '<img class="fill" src="' + esc(url) + '" alt=""><div class="replace-hint">Click to replace</div>';
    toast('Image uploaded');
  } catch (e) { fail(e); }
}
async function savePage() {
  const ctx = window.__pageCtx;
  try {
    for (let bi = 0; bi < ctx.blocks.length; bi++) {
      const b = ctx.blocks[bi];
      const content = {};
      Object.keys(b.content).forEach(function (k) {
        content[k] = document.getElementById('pb-' + bi + '-' + k).value;
      });
      const visible = document.getElementById('pb-' + bi + '-visible').checked;
      const { error } = await DB.client.from('page_blocks').update({ content: content, visible: visible }).eq('id', b.id);
      if (error) throw error;
    }
    const { error: e2 } = await DB.client.from('pages').update({
      seo_title: document.getElementById('seo-title').value,
      seo_description: document.getElementById('seo-desc').value,
      updated_at: new Date().toISOString(),
    }).eq('id', ctx.page.id);
    if (e2) throw e2;
    DB.audit('page.update', ctx.page.slug);
    toast('Published — live on the site');
  } catch (e) { fail(e); }
}
