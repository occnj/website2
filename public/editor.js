// ============================================================
// Oasis CMS — inline visual editor (Elementor-style)
// Loaded on every page but ONLY activates when the URL has
// ?edit=1 (or #edit). Writes to Supabase when a staff member is
// signed in; falls back to a local draft otherwise (so it works
// in preview without a login). Depends on cms-core.js.
// ============================================================
(function () {
  var ACTIVE = /(?:\?|&)edit=1\b/.test(location.search) || /(?:^|#).*\bedit\b/.test(location.hash) || localStorage.getItem('oasis_edit') === '1';
  if (!ACTIVE) return;

  var BASE_PATH = '/website';
  var pagePath = location.pathname.indexOf(BASE_PATH) === 0 ? location.pathname.slice(BASE_PATH.length) : location.pathname;
  var pathParts = pagePath.split('/').filter(Boolean);
  var slug = (pathParts.pop() || 'index').replace('.html', '');
  var COLORS = ['#0096C7', '#C8883A', '#4A8C6A', '#8B6BAE', '#1A2835', '#0d1f2d', '#F9F6F1', '#ffffff'];

  // ---------- store ----------
  function makeStore() {
    // Public pages don't load admin/config.js, so fall back to the same
    // project the public site uses (matches site-data.js). Auth session is
    // shared via localStorage once a staff member signs in at /admin.
    var cfg = window.OASIS_CONFIG || {
      SUPABASE_URL: 'https://twdyeqnlxzvanylhqnjf.supabase.co',
      SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZHllcW5seHp2YW55bGhxbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NzUxNjMsImV4cCI6MjA5OTU1MTE2M30.OHzwlusEyT1CMeyTG3RWR45UutTD7IgRhJXEWWHUYyU'
    };
    var sb = (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase)
      ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
    return {
      sb: sb,
      session: function () { return sb ? sb.auth.getSession().then(function (r) { return r.data.session; }) : Promise.resolve(null); },
      load: function () {
        if (sb) {
          return sb.from('page_overrides').select('edits').eq('slug', slug).single()
            .then(function (r) { return (r.data && r.data.edits) || localDraft() || {}; })
            .catch(function () { return localDraft() || {}; });
        }
        return Promise.resolve(localDraft() || {});
      },
      publish: function (edits) {
        return this.session().then(function (s) {
          if (sb && s) {
            return sb.from('page_overrides').upsert({ slug: slug, edits: edits, updated_at: new Date().toISOString(), updated_by: s.user.id })
              .then(function (r) { if (r.error) throw r.error; return 'live'; });
          }
          localStorage.setItem('oasis_edits:' + slug, JSON.stringify(edits));
          return 'local';
        });
      },
      upload: function (file) {
        return this.session().then(function (s) {
          if (sb && s) {
            var path = 'inline/' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            return sb.storage.from('media').upload(path, file, { upsert: false }).then(function (up) {
              if (up.error) throw up.error;
              return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
            });
          }
          return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(file); });
        });
      }
    };
  }
  function localDraft() { try { return JSON.parse(localStorage.getItem('oasis_draft:' + slug) || 'null'); } catch (e) { return null; } }

  var store = makeStore();
  var edits = {};
  var dirty = false;

  function ensure(k) { edits[k] = edits[k] || {}; return edits[k]; }
  function markDirty() { dirty = true; setStatus('Unsaved changes', 'warn'); localStorage.setItem('oasis_draft:' + slug, JSON.stringify(edits)); }
  var K = window.OASIS.keyFor;

  // ---------- styles ----------
  function injectCSS() {
    var s = document.createElement('style');
    s.id = 'cms-css';
    s.textContent = [
      '#cms-bar{position:fixed;top:0;left:0;right:0;height:52px;background:#12202c;color:#fff;z-index:100000;display:flex;align-items:center;gap:14px;padding:0 16px;font-family:system-ui,sans-serif;box-shadow:0 2px 16px rgba(0,0,0,.3)}',
      'body.cms-on{padding-top:52px!important}',
      '#cms-bar .brand{font-weight:700;font-size:.9rem;letter-spacing:.02em}',
      '#cms-bar .pill{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;background:rgba(255,255,255,.12);padding:4px 10px;border-radius:100px}',
      '#cms-bar .grow{flex:1}',
      '#cms-bar .st{font-size:.78rem;opacity:.8;display:flex;align-items:center;gap:7px}',
      '#cms-bar .dot{width:8px;height:8px;border-radius:50%;background:#4A8C6A}',
      '#cms-bar .dot.warn{background:#C8883A}',
      '#cms-bar button{font:inherit;font-size:.8rem;font-weight:600;border:0;border-radius:8px;padding:9px 15px;cursor:pointer}',
      '#cms-bar .b-pub{background:#0096C7;color:#fff}',
      '#cms-bar .b-pub:hover{background:#0086b3}',
      '#cms-bar .b-ghost{background:rgba(255,255,255,.1);color:#fff}',
      '#cms-bar .b-ghost:hover{background:rgba(255,255,255,.18)}',
      '.cms-hl{outline:2px dashed rgba(0,150,199,.5)!important;outline-offset:2px;cursor:text}',
      '.cms-hl-img{outline:2px dashed rgba(200,136,58,.9)!important;outline-offset:2px;cursor:pointer}',
      '.cms-editing{outline:2px solid #0096C7!important;outline-offset:2px;background:rgba(0,150,199,.04)}',
      '#cms-hover{position:fixed;z-index:100001;display:none;gap:4px;background:#12202c;border-radius:8px;padding:4px;box-shadow:0 4px 18px rgba(0,0,0,.35)}',
      '#cms-hover button{font:inherit;font-size:.72rem;font-weight:600;color:#fff;background:rgba(255,255,255,.12);border:0;border-radius:6px;padding:6px 9px;cursor:pointer;white-space:nowrap}',
      '#cms-hover button:hover{background:#0096C7}',
      '#cms-pop{position:fixed;z-index:100002;display:none;flex-direction:column;gap:8px;background:#fff;color:#12202c;border-radius:10px;padding:12px;box-shadow:0 8px 30px rgba(0,0,0,.25);width:220px;font-family:system-ui,sans-serif}',
      '#cms-pop .row{display:flex;gap:6px;flex-wrap:wrap}',
      '#cms-pop .sw{width:26px;height:26px;border-radius:6px;cursor:pointer;border:2px solid #e4e4e4}',
      '#cms-pop .sw:hover{transform:scale(1.08)}',
      '#cms-pop button{font:inherit;font-size:.8rem;font-weight:600;border:0;border-radius:7px;padding:8px 10px;cursor:pointer;background:#f0f2f4;text-align:left}',
      '#cms-pop button:hover{background:#e3e8ec}',
      '#cms-pop .lbl{font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:#7a8791;font-weight:700}',
      '#cms-pop input[type=text]{font:inherit;font-size:.82rem;padding:7px 9px;border:1px solid #d7dde2;border-radius:7px;width:100%}',
      '.cms-added{outline:1px dashed rgba(0,150,199,.4);outline-offset:3px}',
      '#cms-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#12202c;color:#fff;padding:11px 18px;border-radius:10px;font-family:system-ui;font-size:.85rem;z-index:100003;opacity:0;transition:opacity .2s;box-shadow:0 6px 24px rgba(0,0,0,.3)}',
      '#cms-toast.show{opacity:1}'
    ].join('\n');
    document.head.appendChild(s);
  }

  var elBar, elHover, elPop, elToast, hoverEl = null, editingEl = null;

  function buildChrome() {
    document.body.classList.add('cms-on');
    elBar = document.createElement('div');
    elBar.id = 'cms-bar';
    elBar.innerHTML =
      '<span class="brand">Oasis · Visual Editor</span>' +
      '<span class="pill" id="cms-page"></span>' +
      '<span class="grow"></span>' +
      '<span class="st"><span class="dot" id="cms-dot"></span><span id="cms-stmsg">All changes saved</span></span>' +
      '<button class="b-ghost" id="cms-exit">Exit</button>' +
      '<button class="b-pub" id="cms-pub">Publish</button>';
    document.body.appendChild(elBar);
    document.getElementById('cms-page').textContent = slug === 'index' ? 'Home' : slug.replace(/-/g, ' ');
    document.getElementById('cms-pub').onclick = publish;
    document.getElementById('cms-exit').onclick = function () {
      if (dirty && !confirm('You have unsaved changes. Leave the editor anyway?')) return;
      localStorage.removeItem('oasis_edit');
      location.href = location.pathname;
    };

    elHover = document.createElement('div'); elHover.id = 'cms-hover'; document.body.appendChild(elHover);
    elPop = document.createElement('div'); elPop.id = 'cms-pop'; document.body.appendChild(elPop);
    elToast = document.createElement('div'); elToast.id = 'cms-toast'; document.body.appendChild(elToast);
  }

  function setStatus(msg, kind) {
    var d = document.getElementById('cms-dot'), m = document.getElementById('cms-stmsg');
    if (m) m.textContent = msg;
    if (d) d.className = 'dot' + (kind === 'warn' ? ' warn' : '');
  }
  function toast(msg) { elToast.textContent = msg; elToast.classList.add('show'); clearTimeout(elToast._t); elToast._t = setTimeout(function () { elToast.classList.remove('show'); }, 2200); }

  // ---------- classify + wire ----------
  var sets;
  function reclassify() {
    var c = window.OASIS.collect();
    sets = {
      text: new Set(c.texts), img: new Set(c.images),
      link: new Set(c.links), section: new Set(c.sections)
    };
  }

  function typeOf(el) {
    if (sets.img.has(el)) return 'img';
    if (sets.text.has(el)) return 'text';
    if (sets.link.has(el)) return 'link';
    if (sets.section.has(el)) return 'section';
    return null;
  }
  function nearestEditable(el) {
    var n = el;
    while (n && n !== document.body) {
      if (sets.img.has(n) || sets.text.has(n) || sets.link.has(n)) return n;
      n = n.parentElement;
    }
    return null;
  }
  function nearestSection(el) {
    var n = el;
    while (n && n !== document.body) { if (sets.section.has(n)) return n; n = n.parentElement; }
    return null;
  }

  // ---------- hover toolbar ----------
  function showHover(el) {
    if (editingEl) return;
    hoverEl = el;
    var t = typeOf(el);
    var btns = '';
    if (t === 'img') btns += '<button data-a="replace">⤢ Replace image</button>';
    if (t === 'link') btns += '<button data-a="link">🔗 Edit link</button>';
    if (t === 'text' || t === 'link') btns += '<button data-a="edit">✎ Edit text</button>';
    btns += '<button data-a="section">▤ Section ▾</button>';
    elHover.innerHTML = btns;
    Array.prototype.forEach.call(elHover.querySelectorAll('button'), function (b) {
      b.onclick = function (e) { e.stopPropagation(); e.preventDefault(); hoverAction(b.getAttribute('data-a')); };
    });
    var r = el.getBoundingClientRect();
    elHover.style.display = 'flex';
    var top = Math.max(58, r.top - 34);
    elHover.style.top = top + 'px';
    elHover.style.left = Math.min(window.innerWidth - elHover.offsetWidth - 8, Math.max(8, r.left)) + 'px';
  }
  function hideHover() { if (!editingEl) { elHover.style.display = 'none'; hoverEl = null; } }

  function hoverAction(a) {
    var el = hoverEl;
    if (a === 'edit') startTextEdit(sets.text.has(el) ? el : (el.querySelector('*') || el));
    else if (a === 'replace') pickImage(el);
    else if (a === 'link') editLink(el);
    else if (a === 'section') openSectionMenu(nearestSection(el) || el);
  }

  // ---------- text editing ----------
  function startTextEdit(el) {
    if (!el) return;
    editingEl = el;
    elHover.style.display = 'none';
    var before = el.innerHTML;
    el.setAttribute('contenteditable', 'true');
    el.classList.add('cms-editing');
    el.focus();
    function finish() {
      el.removeAttribute('contenteditable');
      el.classList.remove('cms-editing');
      el.removeEventListener('blur', finish);
      el.removeEventListener('keydown', onKey);
      editingEl = null;
      if (el.innerHTML !== before) { ensure('text')[K(el)] = el.innerHTML; markDirty(); }
    }
    function onKey(e) {
      if (e.key === 'Escape') { el.innerHTML = before; el.blur(); }
      if (e.key === 'Enter' && !e.shiftKey && /^(H[1-6]|SPAN|A|BUTTON|STRONG|LI)$/.test(el.tagName)) { e.preventDefault(); el.blur(); }
    }
    el.addEventListener('blur', finish);
    el.addEventListener('keydown', onKey);
  }

  // ---------- image replace ----------
  function pickImage(el) {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function () {
      if (!inp.files[0]) return;
      setStatus('Uploading image…', 'warn');
      store.upload(inp.files[0]).then(function (url) {
        window.OASIS.applyImage(el, url);
        ensure('img')[K(el)] = url; markDirty(); toast('Image updated');
      }).catch(function (e) { toast('Upload failed: ' + (e.message || e)); });
    };
    inp.click();
  }

  // ---------- link editing ----------
  function editLink(el) {
    openPop(el, function (pop) {
      pop.innerHTML = '<div class="lbl">Link destination</div>' +
        '<input type="text" id="cms-href" value="' + (el.getAttribute('href') || '') + '" placeholder="about.html or https://…">' +
        '<button id="cms-href-save">Save link</button>';
      pop.querySelector('#cms-href-save').onclick = function () {
        var v = pop.querySelector('#cms-href').value.trim();
        el.setAttribute('href', v); ensure('href')[K(el)] = v; markDirty(); closePop(); toast('Link saved');
      };
    });
  }

  // ---------- section menu ----------
  function openSectionMenu(sec) {
    openPop(sec, function (pop) {
      var hidden = sec.style.display === 'none';
      pop.innerHTML =
        '<div class="lbl">Background colour</div><div class="row" id="cms-bgrow"></div>' +
        '<div class="row" style="margin-top:2px"><input type="color" id="cms-bgcustom" style="width:34px;height:30px;border:0;background:none;padding:0"><button id="cms-bgclear" style="flex:1">Clear</button></div>' +
        '<div class="lbl" style="margin-top:6px">Add a block</div>' +
        '<button id="cms-add-text">＋ Text block</button>' +
        '<button id="cms-add-img">＋ Image block</button>' +
        '<div class="lbl" style="margin-top:6px">Section</div>' +
        '<button id="cms-hide">' + (hidden ? '👁 Show section' : '🚫 Hide section') + '</button>';
      var row = pop.querySelector('#cms-bgrow');
      COLORS.forEach(function (c) {
        var sw = document.createElement('div'); sw.className = 'sw'; sw.style.background = c; sw.title = c;
        sw.onclick = function () { setSectionBg(sec, c); };
        row.appendChild(sw);
      });
      pop.querySelector('#cms-bgcustom').oninput = function (e) { setSectionBg(sec, e.target.value); };
      pop.querySelector('#cms-bgclear').onclick = function () { sec.style.background = ''; var s = ensure('style')[K(sec)] || {}; delete s.background; ensure('style')[K(sec)] = s; markDirty(); };
      pop.querySelector('#cms-add-text').onclick = function () { addBlock(sec, 'text'); closePop(); };
      pop.querySelector('#cms-add-img').onclick = function () { addBlock(sec, 'image'); closePop(); };
      pop.querySelector('#cms-hide').onclick = function () {
        if (hidden) { sec.style.display = ''; delete ensure('hidden')[K(sec)]; }
        else { sec.style.display = 'none'; ensure('hidden')[K(sec)] = true; }
        markDirty(); closePop(); toast(hidden ? 'Section shown' : 'Section hidden');
      };
    });
  }
  function setSectionBg(sec, c) {
    sec.style.background = c;
    var s = ensure('style')[K(sec)] || {}; s.background = c; ensure('style')[K(sec)] = s; markDirty();
  }

  // ---------- add block ----------
  function addBlock(sec, type) {
    var host = sec.querySelector('.container') || sec;
    var id = 'add-' + slug + '-' + Date.now();
    var node = window.OASIS.buildBlock({ type: type, id: id });
    host.appendChild(node);
    var ck = K(host);
    edits.added = edits.added || {};
    edits.added[ck] = edits.added[ck] || [];
    edits.added[ck].push({ type: type, id: id, html: type === 'text' ? 'New text block' : undefined });
    markDirty();
    reclassify();
    if (type === 'image') pickImage(node);
    else startTextEdit(node);
    node.scrollTop; // noop
  }

  // ---------- popover helpers ----------
  function openPop(anchor, render) {
    render(elPop);
    elPop.style.display = 'flex';
    var r = anchor.getBoundingClientRect();
    elPop.style.top = Math.min(window.innerHeight - elPop.offsetHeight - 10, Math.max(58, r.top + 4)) + 'px';
    elPop.style.left = Math.min(window.innerWidth - 232, Math.max(8, r.left)) + 'px';
  }
  function closePop() { elPop.style.display = 'none'; }

  // ---------- publish ----------
  function publish() {
    setStatus('Publishing…', 'warn');
    store.publish(edits).then(function (where) {
      dirty = false;
      setStatus(where === 'live' ? 'Published — live on the site' : 'Saved locally (sign in to publish live)');
      toast(where === 'live' ? 'Published live ✓' : 'Saved locally ✓');
    }).catch(function (e) { setStatus('Publish failed', 'warn'); toast('Publish failed: ' + (e.message || e)); });
  }

  // ---------- global listeners ----------
  function wire() {
    document.addEventListener('mouseover', function (e) {
      if (editingEl) return;
      if (e.target.closest('#cms-bar,#cms-hover,#cms-pop,#cms-toast')) return;
      var el = nearestEditable(e.target) || nearestSection(e.target);
      if (el) {
        var t = typeOf(el);
        el.classList.add(t === 'img' ? 'cms-hl-img' : 'cms-hl');
        showHover(el);
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.classList) e.target.classList.remove('cms-hl', 'cms-hl-img');
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('#cms-bar,#cms-hover,#cms-pop,#cms-toast')) return;
      var editable = e.target.closest('a,button');
      if (editable && !editingEl) { e.preventDefault(); e.stopPropagation(); } // block navigation in edit mode
      if (editingEl && !editingEl.contains(e.target)) return; // let blur handle it
      if (editingEl) return;
      var el = nearestEditable(e.target);
      if (!el) { closePop(); return; }
      var t = typeOf(el);
      if (t === 'text' || t === 'link') startTextEdit(sets.text.has(el) ? el : el);
      else if (t === 'img') pickImage(el);
    }, true);
    // drag-drop images onto image slots
    document.addEventListener('dragover', function (e) { var el = nearestEditableImg(e.target); if (el) e.preventDefault(); });
    document.addEventListener('drop', function (e) {
      var el = nearestEditableImg(e.target);
      if (el && e.dataTransfer.files[0]) {
        e.preventDefault();
        setStatus('Uploading image…', 'warn');
        store.upload(e.dataTransfer.files[0]).then(function (url) {
          window.OASIS.applyImage(el, url); ensure('img')[K(el)] = url; markDirty(); toast('Image updated');
        });
      }
    });
    window.addEventListener('scroll', function () { if (hoverEl && !editingEl) showHover(hoverEl); }, true);
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });
  }
  function nearestEditableImg(target) { var n = target; while (n && n !== document.body) { if (sets.img.has(n)) return n; n = n.parentElement; } return null; }

  // ---------- boot ----------
  function boot() {
    injectCSS();
    buildChrome();
    reclassify();
    store.load().then(function (loaded) {
      edits = loaded || {};
      window.OASIS.applyEdits(edits);
      reclassify();
      wire();
      setStatus('All changes saved');
      toast('Editor ready — hover anything to edit');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); });
  else setTimeout(boot, 400);
})();
