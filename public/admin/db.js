// Oasis Admin — Supabase data layer
(function () {
  const CFG = window.OASIS_CONFIG || {};
  const client = (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase)
    ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY)
    : null;

  let me = null; // {id, full_name, role, active}

  async function loadProfile() {
    if (!client) return null;
    const { data: { session } } = await client.auth.getSession();
    if (!session) return null;
    const { data } = await client.from('profiles').select('*').eq('id', session.user.id).single();
    me = data ? Object.assign({ email: session.user.email }, data) : null;
    return me;
  }

  async function list(table, opts) {
    opts = opts || {};
    let q = client.from(table).select(opts.select || '*');
    if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) q = q.eq(k, v);
    (opts.order || []).forEach(function (o) { q = q.order(o[0], { ascending: o[1] !== 'desc' }); });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function save(table, row, auditAction, auditDetail) {
    const q = row.id
      ? client.from(table).update(row).eq('id', row.id).select()
      : client.from(table).insert(row).select();
    const { data, error } = await q;
    if (error) throw error;
    if (auditAction) audit(auditAction, auditDetail);
    return data && data[0];
  }

  async function del(table, id, auditAction, auditDetail) {
    const { error } = await client.from(table).delete().eq('id', id);
    if (error) throw error;
    if (auditAction) audit(auditAction, auditDetail);
  }

  function audit(action, detail) {
    if (!client || !me) return;
    client.from('audit_log').insert({
      actor: me.id, actor_name: me.full_name || me.email, action: action, detail: detail || ''
    }).then(function () {});
  }

  async function upload(file, folder) {
    const path = (folder || 'library') + '/' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const { error } = await client.storage.from('media').upload(path, file, { upsert: false });
    if (error) throw error;
    return client.storage.from('media').getPublicUrl(path).data.publicUrl;
  }

  // Pick a file from disk, upload, return public URL
  function pickAndUpload(folder) {
    return new Promise(function (resolve, reject) {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = function () {
        if (!inp.files[0]) return resolve(null);
        upload(inp.files[0], folder).then(resolve).catch(reject);
      };
      inp.click();
    });
  }

  async function getSettings() {
    const { data, error } = await client.from('site_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    return data;
  }
  async function saveSettings(patch, auditAction) {
    const { error } = await client.from('site_settings').update(patch).eq('id', 1);
    if (error) throw error;
    audit(auditAction || 'settings.update', Object.keys(patch).join(', '));
  }

  function canManageUsers() { return me && ['owner', 'admin'].indexOf(me.role) >= 0; }
  function isEventsOnly() { return me && me.role === 'events_only'; }

  window.DB = {
    client: client, connected: !!client,
    loadProfile: loadProfile, get me() { return me; },
    list: list, save: save, del: del, audit: audit,
    upload: upload, pickAndUpload: pickAndUpload,
    getSettings: getSettings, saveSettings: saveSettings,
    canManageUsers: canManageUsers, isEventsOnly: isEventsOnly,
  };
})();
