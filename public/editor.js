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

  var BASE_PATH = '';
  if (window.OASIS_EDITOR_ACTIVE) return;
  window.OASIS_EDITOR_ACTIVE = true;
  var pagePath = location.pathname.indexOf(BASE_PATH) === 0 ? location.pathname.slice(BASE_PATH.length) : location.pathname;
  var pathParts = pagePath.split('/').filter(Boolean);
  var slug = (pathParts.join('/') || 'index').replace(/\.html$/, '');
  var legacySlug = pathParts[pathParts.length - 1] || 'index';
  var COLORS = ['#0096C7', '#C8883A', '#4A8C6A', '#8B6BAE', '#1A2835', '#0d1f2d', '#F9F6F1', '#ffffff'];

  // ---------- store ----------
  function makeStore() {
    // Next.js injects public Supabase configuration from deployment env.
    // Auth session is shared once a staff member signs in at /admin.
    var cfg = window.OASIS_CONFIG || {};
    var sb = window.OASIS_SUPABASE || ((cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase)
      ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null);
    return {
      sb: sb,
      session: function () { return sb ? sb.auth.getSession().then(function (r) { return r.data.session; }) : Promise.resolve(null); },
      load: function () {
        if (sb) {
          return sb.from('page_overrides').select('edits').eq('slug', slug).maybeSingle()
            .then(function (r) {
              if (r.error) throw r.error;
              if (!r.data && slug !== legacySlug) return sb.from('page_overrides').select('edits').eq('slug', legacySlug).maybeSingle();
              return r;
            }).then(function (r) { if (r.error) throw r.error; return localDraft() || (r.data && r.data.edits) || {}; });
        }
        return Promise.resolve(localDraft() || {});
      },
      publish: function (edits) {
        return this.session().then(function (s) {
          if (sb && s) {
            return sb.from('page_overrides').upsert({ slug: slug, edits: edits, updated_at: new Date().toISOString(), updated_by: s.user.id })
              .then(function (r) { if (r.error) throw r.error; return 'live'; });
          }
          localStorage.setItem('oasis_draft:' + slug, JSON.stringify(edits));
          return 'local';
        });
      },
      upload: function (file) {
        // Compress via API first, fall back to original if it fails
        var compress = function (f) {
          var fd = new FormData(); fd.append('file', f);
          return fetch('/api/compress-image', { method: 'POST', body: fd }).then(function (res) {
            if (!res.ok) throw new Error('skip');
            return res.blob().then(function (blob) {
              var name = f.name.replace(/\.[^.]+$/, '') + '.webp';
              return new File([blob], name, { type: 'image/webp' });
            });
          }).catch(function () { return f; }); // fall back to original
        };
        return compress(file).then(function (uploadFile) {
          return store.session().then(function (s) {
            if (sb && s) {
              var path = 'inline/' + Date.now() + '-' + uploadFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
              return sb.storage.from('media').upload(path, uploadFile, { upsert: false }).then(function (up) {
                if (up.error) throw up.error;
                return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
              });
            }
            return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.readAsDataURL(uploadFile); });
          });
        });
      }
    };
  }
  function localDraft() { try { return JSON.parse(localStorage.getItem('oasis_draft:' + slug) || 'null'); } catch (e) { return null; } }

  var store = makeStore();
  var edits = {};
  var dirty = false;
  var lastOrphans = [];
  var revision = 0, publishing = false, ready = false;

  // Share the same five-minute inactivity window as /admin. Activity in
  // either tab keeps the authenticated editing session alive.
  function setupInactivitySecurity() {
    store.session().then(function (session) {
      if (!session || !store.sb) return;
      var limit = 5 * 60 * 1000;
      var activityKey = 'oasis-admin-last-activity';
      var timer = null;
      var lastReset = 0;
      function signOutInactive() {
        dirty = false; // drafts are already saved; do not block the redirect
        sessionStorage.setItem('oasis-signout-reason', 'inactive');
        localStorage.removeItem('oasis_edit');
        store.sb.auth.signOut().finally(function () { location.href = BASE_PATH + '/admin'; });
      }
      function schedule() {
        clearTimeout(timer);
        var last = Number(localStorage.getItem(activityKey)) || Date.now();
        var remaining = Math.max(0, limit - (Date.now() - last));
        timer = setTimeout(signOutInactive, remaining);
      }
      function record() {
        var now = Date.now();
        if (now - lastReset < 1000) return;
        lastReset = now;
        localStorage.setItem(activityKey, String(now));
        schedule();
      }
      ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'scroll'].forEach(function (name) {
        window.addEventListener(name, record, { passive: true });
      });
      window.addEventListener('storage', function (event) { if (event.key === activityKey) schedule(); });
      record();
    });
  }

  // A section is "hidden" per the saved overrides, not per its inline display —
  // inside the editor we deliberately keep it on screen (ghosted) so it can
  // still be selected and un-hidden.
  function isHiddenSection(sec) {
    return !!(edits.hidden && edits.hidden[K(sec)]);
  }
  // Re-apply the ghosted look for every hidden section. Called after load and
  // after any hide/show toggle. Undoes the display:none that applyEdits sets,
  // because that is the public-site behaviour, not the editor's.
  function refreshHiddenPreview() {
    window.OASIS.collect().sections.forEach(function (sec) {
      if (isHiddenSection(sec)) {
        sec.style.display = '';
        sec.classList.add('cms-hidden-preview');
      } else {
        sec.classList.remove('cms-hidden-preview');
      }
    });
  }

  // Remove a block that was added through the editor. Added blocks carry a
  // data-cms id, and keyFor returns that id, so their text/image/style overrides
  // are keyed by it as well — all of it has to go or a deleted block would be
  // rebuilt (or leave orphaned overrides behind) on the next load.
  function deleteBlock(node) {
    var id = node.getAttribute('data-cms');
    if (!id) return;
    if (edits.added) {
      Object.keys(edits.added).forEach(function (ck) {
        edits.added[ck] = edits.added[ck].filter(function (b) { return b.id !== id; });
        if (!edits.added[ck].length) delete edits.added[ck];
      });
      if (!Object.keys(edits.added).length) delete edits.added;
    }
    ['text', 'img', 'style', 'copy', 'sig', 'hidden'].forEach(function (bucket) {
      if (!edits[bucket]) return;
      Object.keys(edits[bucket]).forEach(function (k) {
        if (k === id || k.indexOf(id + '::') === 0 || k.indexOf(id + '>') === 0) delete edits[bucket][k];
      });
    });
    if (editingEl && node.contains(editingEl)) editingEl = null;
    node.remove();
    hideHover();
    closePop();
    markDirty();
    reclassify();
    toast('Block deleted');
  }

  function ensure(k) { edits[k] = edits[k] || {}; return edits[k]; }
  function markDirty() { dirty = true; revision++; setStatus('Unsaved changes', 'warn'); try { localStorage.setItem('oasis_draft:' + slug, JSON.stringify(edits)); } catch (e) { setStatus('Draft storage full — publish to save', 'warn'); } }
  var K = window.OASIS.keyFor;

  // matchMedia is missing in some non-browser environments (and old browsers),
  // so never call it directly — treat an absent implementation as "not matching"
  // rather than letting it throw and abort editor setup.
  function mq(query) {
    try { return !!(window.matchMedia && window.matchMedia(query).matches); }
    catch (e) { return false; }
  }

  // Floating panels (All text, orphan review) become a full-screen sheet on a
  // phone; a small floating box is unusable next to the on-screen keyboard.
  function panelStyle() {
    return mq('(max-width:768px)')
      ? 'position:fixed;inset:0;width:100%;height:100%;overflow:auto;background:white;color:#12202c;padding:14px;z-index:100004;font:16px system-ui;-webkit-overflow-scrolling:touch'
      : 'position:fixed;inset:60px 12px 12px auto;width:min(560px,calc(100vw - 24px));overflow:auto;background:white;color:#12202c;padding:20px;z-index:100004;box-shadow:0 4px 30px #0005;border-radius:12px;font:14px system-ui';
  }
  // Close is sticky and full-width on a phone so it stays reachable while
  // scrolling a long list of fields.
  function styleCloseButton(btn) {
    if (mq('(max-width:768px)')) btn.style.cssText = 'position:sticky;top:0;width:100%;min-height:46px;font:600 16px system-ui;background:#12202c;color:#fff;border:0;border-radius:8px;margin-bottom:12px;z-index:1';
  }

  // Record the ORIGINAL text for a key the first time it is edited, so the
  // public site can heal the edit onto the right element if a later redesign
  // shifts its DOM path. Only the pre-edit content is a reliable fingerprint,
  // so we never overwrite an existing signature.
  function recordSig(key, originalText) {
    var s = String(originalText == null ? '' : originalText).replace(/\s+/g, ' ').trim();
    if (!s) return;
    var sigs = ensure('sig');
    if (!Object.prototype.hasOwnProperty.call(sigs, key)) sigs[key] = s;
  }

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
      '.cms-added{outline:1px dashed rgba(0,150,199,.4);outline-offset:3px;min-height:24px}',
      /* An added text block left empty has no height to tap. In edit mode give it
         a clear placeholder box so it can be selected, edited or deleted. */
      'p.cms-added:empty{min-height:40px;padding:8px 12px;border-radius:6px;background:rgba(0,150,199,.06)}',
      'p.cms-added:empty::before{content:"Empty text block — tap to edit or delete";color:#7a8791;font-size:.85rem;font-style:italic}',
      /* A section hidden from the live site stays VISIBLE but ghosted inside the
         editor. If it were really display:none it could not be hovered, so its
         own menu — the only place with "Show section" — would be unreachable and
         the hide would be permanent. */
      '.cms-hidden-preview{opacity:.42!important;outline:2px dashed #C8883A!important;outline-offset:-4px;position:relative}',
      '.cms-hidden-preview::after{content:"Hidden on the live site";position:absolute;top:8px;left:8px;background:#C8883A;color:#fff;font:600 11px system-ui;letter-spacing:.02em;padding:4px 10px;border-radius:100px;z-index:5;pointer-events:none}',
      '#cms-hover button.danger{background:rgba(220,70,60,.9)}',
      '#cms-hover button.danger:hover{background:#c0392b}',
      '#cms-pop button.danger{background:#fdeaea;color:#b3261e}',
      '#cms-pop button.danger:hover{background:#f9d5d5}',
      /* ---- MOBILE / TOUCH ----
         The bar is built for a wide desktop viewport. On a phone the brand and
         page pill are the first things worth dropping, tap targets need to grow
         to a comfortable size, and inputs must be >=16px or iOS zooms on focus. */
      '@media (max-width:768px){',
      '  #cms-bar{height:auto;min-height:56px;flex-wrap:wrap;gap:8px;padding:8px 10px}',
      '  #cms-bar .brand{display:none}',
      '  #cms-bar .pill{display:none}',
      '  #cms-bar .grow{display:none}',
      '  #cms-bar .st{order:1;flex:1 1 100%;font-size:.75rem;min-width:0}',
      '  #cms-bar .st #cms-stmsg{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '  #cms-bar button{order:2;flex:1 1 0;min-height:44px;font-size:.82rem;padding:11px 10px}',
      '  #cms-hover{gap:6px;padding:6px;flex-wrap:wrap;justify-content:center}',
      '  #cms-hover button{font-size:.8rem;padding:11px 13px;min-height:44px}',
      '  #cms-pop{width:min(300px,calc(100vw - 24px));padding:14px}',
      '  #cms-pop button{padding:12px;min-height:44px}',
      '  #cms-pop .sw{width:34px;height:34px}',
      '  #cms-pop input[type=text]{font-size:16px;padding:10px 11px}',
      '  #cms-toast{bottom:14px;width:calc(100vw - 28px);text-align:center}',
      '}',
      '#cms-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#12202c;color:#fff;padding:11px 18px;border-radius:10px;font-family:system-ui;font-size:.85rem;z-index:100003;opacity:0;transition:opacity .2s;box-shadow:0 6px 24px rgba(0,0,0,.3)}',
      '#cms-toast.show{opacity:1}',
      '@keyframes cms-spin{to{transform:rotate(360deg)}}'
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
      '<button class="b-ghost" id="cms-all-text">All text</button>' +
      '<button class="b-ghost" id="cms-exit">Exit</button>' +
      '<button class="b-pub" id="cms-pub">Publish</button>';
    document.body.appendChild(elBar);
    document.getElementById('cms-page').textContent = slug === 'index' ? 'Home' : slug.replace(/-/g, ' ');
    document.getElementById('cms-pub').onclick = publish;
    document.getElementById('cms-all-text').onclick = openTextPanel;
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
    if (sets.img.has(el)) btns += '<button data-a="replace">⤢ Replace image</button>';
    if (sets.link.has(el)) btns += '<button data-a="link">🔗 Edit link</button>';
    if (sets.text.has(el)) btns += '<button data-a="edit">✎ Edit text</button>';
    if (el.closest && el.closest('.cms-added')) btns += '<button class="danger" data-a="delete">🗑 Delete block</button>';
    btns += '<button data-a="section">▤ Section ▾</button>';
    elHover.innerHTML = btns;
    Array.prototype.forEach.call(elHover.querySelectorAll('button'), function (b) {
      b.onclick = function (e) { e.stopPropagation(); e.preventDefault(); hoverAction(b.getAttribute('data-a')); };
    });
    var r = el.getBoundingClientRect();
    elHover.style.display = 'flex';
    if (mq('(max-width:768px)')) {
      // The toolbar wraps to multiple rows on a phone, so measure it after it is
      // visible and flip below the element when there is no room above.
      elHover.style.left = '8px';
      elHover.style.right = '8px';
      var h = elHover.offsetHeight;
      var above = r.top - h - 8;
      elHover.style.top = (above > 60 ? above : Math.min(window.innerHeight - h - 8, r.bottom + 8)) + 'px';
      return;
    }
    elHover.style.right = '';
    var top = Math.max(58, r.top - 34);
    elHover.style.top = top + 'px';
    elHover.style.left = Math.min(window.innerWidth - elHover.offsetWidth - 8, Math.max(8, r.left)) + 'px';
  }
  function hideHover() { if (!editingEl) { elHover.style.display = 'none'; hoverEl = null; } }

  function hoverAction(a) {
    var el = hoverEl;
    if (a === 'edit' && sets.text.has(el)) startTextEdit(el);
    else if (a === 'replace') pickImage(el);
    else if (a === 'link') editLink(el);
    else if (a === 'delete') {
      var block = el.closest('.cms-added');
      if (block && window.confirm('Delete this block? This cannot be undone once you publish.')) deleteBlock(block);
    }
    else if (a === 'section') openSectionMenu(nearestSection(el) || el);
  }

  // ---------- text editing ----------
  function startTextEdit(el) {
    if (!el) return;
    if (editingEl) editingEl.blur();
    editingEl = el;
    elHover.style.display = 'none';
    var before = el.innerHTML;
    recordSig(K(el), el.textContent);
    el.setAttribute('contenteditable', 'true');
    el.classList.add('cms-editing');
    el.focus();
    function finish() {
      el.removeAttribute('contenteditable');
      el.classList.remove('cms-editing');
      el.removeEventListener('blur', finish);
      el.removeEventListener('input', rememberInput);
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('paste', onPaste);
      el.removeEventListener('drop', onDrop);
      editingEl = null;
      var cleanHtml = window.OASIS.sanitizeHtml(el.innerHTML);
      if (el.innerHTML !== cleanHtml) el.innerHTML = cleanHtml;
      if (cleanHtml !== before) { ensure('text')[K(el)] = cleanHtml; Object.keys(edits.copy || {}).forEach(function (key) { if (key.indexOf(K(el) + '::') === 0 || key.indexOf(K(el) + '>') === 0) delete edits.copy[key]; }); markDirty(); }
      reclassify();
    }
    function onKey(e) {
      if (e.key === 'Escape') { el.innerHTML = before; ensure('text')[K(el)] = before; markDirty(); el.blur(); }
      if (e.key === 'Enter' && !e.shiftKey && /^(H[1-6]|SPAN|A|BUTTON|STRONG|LI)$/.test(el.tagName)) { e.preventDefault(); el.blur(); }
    }
    // Paste as PLAIN TEXT. Copying from Word, Google Docs or another site brings
    // along <span style="font-family:…;font-size:…;color:…"> markup, and the
    // sanitizer only strips dangerous tags — it deliberately keeps style/class —
    // so that formatting would survive and visibly override the site's own
    // typography. Inserting text only means the block keeps its coded size,
    // colour and font.
    function onPaste(e) {
      e.preventDefault();
      var cb = e.clipboardData || window.clipboardData;
      if (!cb) return;
      var text = cb.getData('text/plain') || '';
      if (!text) return;
      insertPlainText(el, text);
    }
    // A drag-and-drop of selected text carries the same rich markup as a paste.
    function onDrop(e) {
      if (!e.dataTransfer) return;
      e.preventDefault();
      var text = e.dataTransfer.getData('text/plain') || '';
      if (text) insertPlainText(el, text);
    }
    el.addEventListener('input', rememberInput);
    function rememberInput() { ensure('text')[K(el)] = window.OASIS.sanitizeHtml(el.innerHTML); markDirty(); }
    el.addEventListener('blur', finish);
    el.addEventListener('keydown', onKey);
    el.addEventListener('paste', onPaste);
    el.addEventListener('drop', onDrop);
  }

  // Insert plain text at the caret without introducing any markup. Newlines
  // become <br> only where the element is a block that can hold them; for
  // single-line elements (headings, buttons, links) they collapse to spaces so a
  // multi-line paste cannot break the layout.
  function insertPlainText(el, text) {
    var multiline = !/^(H[1-6]|SPAN|A|BUTTON|STRONG|LI|LABEL)$/.test(el.tagName);
    var clean = String(text).replace(/\r\n?/g, '\n');
    clean = multiline ? clean.replace(/\n{3,}/g, '\n\n') : clean.replace(/\s*\n\s*/g, ' ');
    // execCommand('insertText') keeps the browser's own undo stack intact, which
    // a manual range replacement would destroy.
    var ok = false;
    try { ok = document.execCommand('insertText', false, clean); } catch (err) { ok = false; }
    if (ok) return;
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) { el.appendChild(document.createTextNode(clean)); return; }
    var range = sel.getRangeAt(0);
    range.deleteContents();
    var node = document.createTextNode(clean);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ---------- image replace ----------
  function pickImage(el) {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function () {
      if (!inp.files[0]) return;
      setStatus('Uploading — please wait…', 'warn');
      // Show a visible overlay on the image being replaced so the user knows something is happening
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px';
      overlay.innerHTML = '<div style="width:44px;height:44px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:cms-spin .7s linear infinite"></div><span style="color:#fff;font-family:sans-serif;font-size:.95rem;font-weight:600">Uploading image…</span>';
      document.body.appendChild(overlay);
      store.upload(inp.files[0]).then(function (url) {
        document.body.removeChild(overlay);
        window.OASIS.applyImage(el, url);
        ensure('img')[K(el)] = url; markDirty(); toast('Image updated ✓');
        setStatus('Unsaved changes', 'warn');
      }).catch(function (e) {
        document.body.removeChild(overlay);
        toast('Upload failed: ' + (e.message || e));
        setStatus('Upload failed', 'warn');
      });
    };
    inp.click();
  }

  // ---------- link editing ----------
  function editLink(el) {
    openPop(el, function (pop) {
      pop.innerHTML = '<div class="lbl">Link destination</div>' +
        '<input type="text" id="cms-href" placeholder="/about or https://…">' +
        '<button id="cms-href-save">Save link</button>';
      pop.querySelector('#cms-href').value = el.getAttribute('href') || '';
      pop.querySelector('#cms-href-save').onclick = function () {
        var v = window.OASIS.safeUrl(pop.querySelector('#cms-href').value);
        if (!v) { toast('Use a safe website, page, mailto, tel, or anchor link'); return; }
        el.setAttribute('href', v); ensure('href')[K(el)] = v; markDirty(); closePop(); toast('Link saved');
      };
    });
  }

  // ---------- section menu ----------
  function openSectionMenu(sec) {
    openPop(sec, function (pop) {
      var hidden = isHiddenSection(sec);
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
        if (hidden) delete ensure('hidden')[K(sec)];
        else ensure('hidden')[K(sec)] = true;
        sec.style.display = '';        // never really hide it inside the editor
        refreshHiddenPreview();
        markDirty(); closePop();
        toast(hidden ? 'Section shown' : 'Section hidden — still visible here, hidden on the live site');
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
    if (!ready || publishing) return;
    if (editingEl) editingEl.blur();
    var snapshot = JSON.parse(JSON.stringify(edits)), savedRevision = revision;
    publishing = true;
    document.getElementById('cms-pub').disabled = true;
    setStatus('Publishing…', 'warn');
    store.publish(snapshot).then(function (where) {
      if (revision === savedRevision) {
        dirty = false;
        if (where === 'live') localStorage.removeItem('oasis_draft:' + slug);
        setStatus(where === 'live' ? 'Published — live on the site' : 'Saved locally (sign in to publish live)');
      } else setStatus('New changes still need publishing', 'warn');
      toast(where === 'live' ? 'Published live ✓' : 'Saved locally ✓');
    }).catch(function (e) { setStatus('Publish failed — changes kept', 'warn'); toast('Publish failed: ' + (e.message || e)); })
      .finally(function () { publishing = false; document.getElementById('cms-pub').disabled = false; });
  }

  function showOrphans() {
    var previous = document.getElementById('cms-text-panel');
    if (previous) previous.remove();
    var panel = document.createElement('div');
    panel.id = 'cms-text-panel';
    panel.style.cssText = panelStyle();
    var reasonText = { 'ambiguous': 'the same wording appears more than once, so it was not safe to guess', 'not-found': 'the original wording is no longer on the page', 'no-signature': 'this edit predates change-tracking and cannot be auto-placed' };
    var html = '<button type="button">Close</button><h2>Edits that could not be placed</h2>' +
      '<p>The page changed since these were saved, so they were not applied automatically. Find the matching text on the page and re-enter it, then publish. Nothing was lost — the old values are shown below.</p>';
    lastOrphans.forEach(function (o) {
      html += '<div style="border:1px solid #e3e8ec;border-radius:8px;padding:12px;margin:0 0 12px">' +
        '<div style="font-weight:600;margin-bottom:4px">' + (o.preview ? escapeHtml(o.preview) : '(empty)') + '</div>' +
        '<div style="font-size:.8rem;color:#7a8791">Why: ' + (reasonText[o.reason] || o.reason) + '</div></div>';
    });
    panel.innerHTML = html;
    var orphanClose = panel.querySelector('button');
    styleCloseButton(orphanClose);
    orphanClose.onclick = function () { panel.remove(); };
    document.body.appendChild(panel);
  }
  function escapeHtml(s) { var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }

  function openTextPanel() {
    if (editingEl) editingEl.blur();
    var previous = document.getElementById('cms-text-panel');
    if (previous) previous.remove();
    var targets = window.OASIS.copyTargets();
    var panel = document.createElement('div');
    panel.id = 'cms-text-panel';
    panel.style.cssText = panelStyle();
    panel.innerHTML = '<button type="button">Close</button><h2>All page text</h2><p>Edit any wording or punctuation, including hidden content, form hints and image descriptions. Alt-click a tab or menu on the page to open other content, then reopen this list. Publish when finished.</p><input type="search" placeholder="Find text…" style="width:100%;padding:10px;margin-bottom:12px;font-size:16px;box-sizing:border-box"><div class="cms-text-rows"></div>';
    var textClose = panel.querySelector('button');
    styleCloseButton(textClose);
    textClose.onclick = function () { panel.remove(); };
    var rows = panel.querySelector('.cms-text-rows');
    window.OASIS.collect().sections.forEach(function (section) {
      if (!edits.hidden || !edits.hidden[K(section)]) return;
      var show = document.createElement('button');
      show.type = 'button'; show.textContent = 'Show hidden section: ' + (section.getAttribute('data-screen-label') || section.id || section.tagName.toLowerCase());
      show.onclick = function () { delete edits.hidden[K(section)]; section.style.display = ''; refreshHiddenPreview(); markDirty(); show.remove(); };
      panel.insertBefore(show, rows);
    });
    targets.forEach(function (target) {
      var label = document.createElement('label');
      label.style.cssText = 'display:block;margin:0 0 14px';
      var caption = document.createElement('div');
      caption.textContent = target.attribute || target.el.tagName.toLowerCase();
      var field = document.createElement('textarea');
      field.value = target.get();
      field.rows = Math.min(6, Math.max(2, Math.ceil(field.value.length / 65)));
      field.style.cssText = mq('(max-width:768px)')
        ? 'width:100%;padding:11px;font:16px system-ui;box-sizing:border-box;border:1px solid #d7dde2;border-radius:8px'
        : 'width:100%;padding:8px;font:inherit;box-sizing:border-box';
      var originalValue = target.get();
      field.oninput = function () { recordSig(target.key, originalValue); target.set(field.value); ensure('copy')[target.key] = field.value; markDirty(); };
      label.append(caption, field); rows.appendChild(label);
    });
    panel.querySelector('input').oninput = function (event) {
      var query = event.target.value.toLowerCase();
      Array.prototype.forEach.call(rows.children, function (row) { row.hidden = !row.querySelector('textarea').value.toLowerCase().includes(query); });
    };
    document.body.appendChild(panel);
  }

  // ---------- global listeners ----------
  function wire() {
    // Touch devices never fire a real hover, so the toolbar would only appear at
    // the same instant editing began. On touch we make selection explicit: the
    // first tap highlights the element and shows its toolbar, a second tap (or
    // the toolbar's own Edit button) starts editing.
    // Use the (hover) media feature alone. `'ontouchstart' in window` is true on
    // any touch-capable device including laptops with a touchscreen, which would
    // wrongly strip hover from users who do have a mouse. `(hover: none)` means
    // the PRIMARY input cannot hover — exactly the phones/tablets we want here.
    var isTouch = mq('(hover:none)');
    var tapSelected = null;
    function clearTapSelection() {
      if (tapSelected && tapSelected.classList) tapSelected.classList.remove('cms-hl', 'cms-hl-img');
      tapSelected = null;
    }

    document.addEventListener('mouseover', function (e) {
      if (isTouch) return; // handled by the tap flow below
      if (editingEl) return;
      if (e.target.closest('#cms-bar,#cms-hover,#cms-pop,#cms-toast,#cms-text-panel')) return;
      var el = nearestEditable(e.target) || nearestSection(e.target);
      if (el) {
        var t = typeOf(el);
        el.classList.add(t === 'img' ? 'cms-hl-img' : 'cms-hl');
        showHover(el);
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (isTouch) return;
      if (e.target.classList) e.target.classList.remove('cms-hl', 'cms-hl-img');
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('#cms-bar,#cms-hover,#cms-pop,#cms-toast,#cms-text-panel')) return;
      if (e.altKey && e.target.closest('button:not([type=submit]),summary')) return;
      var editable = e.target.closest('a,button');
      if (editable && !editingEl) { e.preventDefault(); e.stopPropagation(); } // block navigation in edit mode
      if (editingEl && !editingEl.contains(e.target)) return; // let blur handle it
      if (editingEl) return;
      var el = nearestEditable(e.target);
      if (!el) { closePop(); clearTapSelection(); return; }
      var t = typeOf(el);
      if (isTouch && tapSelected !== el) {
        // First tap on a new element: select it and show the toolbar only.
        e.preventDefault(); e.stopPropagation();
        clearTapSelection();
        tapSelected = el;
        el.classList.add(t === 'img' ? 'cms-hl-img' : 'cms-hl');
        showHover(el);
        return;
      }
      if (isTouch) clearTapSelection(); // second tap on same element falls through
      if (t === 'text') startTextEdit(el);
      else if (t === 'link') editLink(el);
      else if (t === 'img') pickImage(el);
    }, true);
    document.addEventListener('submit', function (e) { e.preventDefault(); e.stopPropagation(); toast('Exit the editor to submit forms'); }, true);
    // drag-drop images onto image slots
    document.addEventListener('dragover', function (e) { var el = nearestEditableImg(e.target); if (el) e.preventDefault(); });
    document.addEventListener('drop', function (e) {
      var el = nearestEditableImg(e.target);
      if (el && e.dataTransfer.files[0]) {
        e.preventDefault();
        setStatus('Uploading image…', 'warn');
        store.upload(e.dataTransfer.files[0]).then(function (url) {
          window.OASIS.applyImage(el, url); ensure('img')[K(el)] = url; markDirty(); toast('Image updated');
        }).catch(function (error) { setStatus('Upload failed', 'warn'); toast(error.message || 'Upload failed'); });
      }
    });
    window.addEventListener('scroll', function () { if (hoverEl && !editingEl) showHover(hoverEl); }, true);
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });
  }
  function nearestEditableImg(target) { var n = target; while (n && n !== document.body) { if (sets.img.has(n)) return n; n = n.parentElement; } return null; }

  // ---------- boot ----------
  function boot() {
    setupInactivitySecurity();
    injectCSS();
    buildChrome();
    reclassify();
    document.getElementById('cms-pub').disabled = true;
    setStatus('Loading saved content…');
    store.load().then(function (loaded) {
      edits = loaded || {};
      var report = window.OASIS.applyEdits(edits);
      refreshHiddenPreview();
      reclassify();
      wire();
      ready = true;
      document.getElementById('cms-pub').disabled = false;
      dirty = !!localDraft();
      if (report && report.orphaned && report.orphaned.length) {
        lastOrphans = report.orphaned;
        var n = report.orphaned.length;
        setStatus(n + ' saved edit' + (n > 1 ? 's' : '') + ' could not be placed — click to review', 'warn');
        var msg = document.getElementById('cms-stmsg');
        if (msg) { msg.style.cursor = 'pointer'; msg.title = 'Some previously saved edits no longer match the page and were not applied'; msg.onclick = showOrphans; }
        toast(n + ' saved edit' + (n > 1 ? 's' : '') + ' could not be placed after a page change');
      } else {
        setStatus(dirty ? 'Recovered unpublished draft' : 'All changes saved', dirty ? 'warn' : undefined);
      }
      var observer = new MutationObserver(function (records) {
        if (!window.document || editingEl || document.getElementById('cms-text-panel')) return;
        if (!records.some(function (r) { var el = r.target.nodeType === 1 ? r.target : r.target.parentElement; return el && !el.closest('#cms-bar,#cms-hover,#cms-pop,#cms-toast,#cms-text-panel'); })) return;
        observer.disconnect(); window.OASIS.applyEdits(edits); reclassify();
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      toast('Editor ready — hover anything to edit');
    }).catch(function (error) { setStatus('Could not load saved content — reload to retry', 'warn'); toast(error.message || 'Load failed'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); });
  else setTimeout(boot, 400);
})();
