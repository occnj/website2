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

  async function compressAndUpload(file, folder) {
    // Try to compress via the server-side API first. Falls back to the original
    // file if compression fails (e.g. SVG, unsupported format, API unavailable).
    let uploadFile = file;
    let uploadName = file.name;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/compress-image', { method: 'POST', body: fd });
      if (res.ok) {
        const blob = await res.blob();
        const saving = res.headers.get('X-Size-Saving') || '';
        uploadName = file.name.replace(/\.[^.]+$/, '') + '.webp';
        uploadFile = new File([blob], uploadName, { type: 'image/webp' });
        if (window.toast && saving) window.toast('Compressed ' + saving + ' smaller — uploading…');
      }
    } catch (e) {
      console.warn('[upload] compression skipped:', e.message);
    }
    const path = (folder || 'library') + '/' + Date.now() + '-' + uploadName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const { error } = await client.storage.from('media').upload(path, uploadFile, { upsert: false });
    if (error) throw error;
    return client.storage.from('media').getPublicUrl(path).data.publicUrl;
  }

  async function upload(file, folder) {
    if (window.toast) window.toast('Compressing & uploading — please wait…');
    return compressAndUpload(file, folder);
  }

  // Upload several files in sequence, reporting progress after each one so the
  // UI can show "3 of 12" instead of freezing. Returns the list of public URLs
  // in the same order. onProgress({ done, total, url, name, failed }).
  async function uploadMany(files, folder, onProgress) {
    var list = Array.prototype.slice.call(files || []);
    var urls = [];
    for (var i = 0; i < list.length; i++) {
      try {
        var url = await compressAndUpload(list[i], folder);
        urls.push(url);
        if (onProgress) onProgress({ done: i + 1, total: list.length, url: url, name: list[i].name, failed: false });
      } catch (e) {
        console.warn('[uploadMany] failed:', list[i] && list[i].name, e && e.message);
        if (onProgress) onProgress({ done: i + 1, total: list.length, url: null, name: list[i].name, failed: true });
      }
    }
    return urls;
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

  // Pick MANY files at once (multiple), upload them all with progress.
  function pickAndUploadMany(folder, onProgress, maxFiles) {
    return new Promise(function (resolve, reject) {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
      inp.onchange = function () {
        var files = Array.prototype.slice.call(inp.files || []);
        if (!files.length) return resolve([]);
        if (maxFiles && files.length > maxFiles) files = files.slice(0, maxFiles);
        uploadMany(files, folder, onProgress).then(resolve).catch(reject);
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
  async function getFormSettings() {
    const { data, error } = await client.from('form_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    return data;
  }
  async function saveFormSettings(patch) {
    const { error } = await client.from('form_settings').update(patch).eq('id', 1);
    if (error) throw error;
    audit('settings.form_recipients', Object.keys(patch).join(', '));
  }

  function canManageUsers() { return me && ['owner', 'admin'].indexOf(me.role) >= 0; }
  function isEventsOnly() { return me && me.role === 'events_only'; }

  window.DB = {
    client: client, connected: !!client,
    loadProfile: loadProfile, get me() { return me; },
    list: list, save: save, del: del, audit: audit,
    upload: upload, pickAndUpload: pickAndUpload,
    uploadMany: uploadMany, pickAndUploadMany: pickAndUploadMany,
    getSettings: getSettings, saveSettings: saveSettings,
    getFormSettings: getFormSettings, saveFormSettings: saveFormSettings,
    canManageUsers: canManageUsers, isEventsOnly: isEventsOnly,
  };
})();
