// ============================================================
// Oasis CMS — shared core (loaded on every page)
// Provides:
//   OASIS.keyFor(el)        stable DOM-path key for an element
//   OASIS.collect()         { texts:[], images:[], links:[], sections:[] }
//   OASIS.applyEdits(edits) apply a saved overrides object to the live DOM
// The SAME key algorithm is used by the public site (to re-apply saved
// edits) and by editor.js (to record them) — so nothing needs hand-tagging.
// ============================================================
(function () {
  var ROOT_SKIP = 'SCRIPT,STYLE,NOSCRIPT,SVG,PATH,IFRAME';

  // ---- stable key from an element's position in the tree ----
  function keyFor(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.hasAttribute('data-cms')) return el.getAttribute('data-cms');
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node.tagName !== 'BODY' && node.tagName !== 'HTML') {
      var seg = node.tagName.toLowerCase();
      var p = node.parentNode;
      if (p && p.children) {
        var same = [];
        for (var i = 0; i < p.children.length; i++) {
          if (p.children[i].tagName === node.tagName) same.push(p.children[i]);
        }
        if (same.length > 1) seg += ':' + (same.indexOf(node) + 1);
      }
      parts.unshift(seg);
      node = node.parentNode;
    }
    return parts.join('>');
  }

  // ---- which elements are editable ----
  var TEXT_SEL = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,button,' +
    '.t-eyebrow,.hero-eyebrow,.involve-title,.involve-desc,.involve-num,' +
    '.sermon-series,.sermon-date,.info-item-text strong,.info-item-text span,' +
    '.stat-value,.stat-label,.circle-card h4,.circle-card p,.event-info h4,.event-info p,' +
    '.event-date-block .month,.event-date-block .day,td,th,figcaption,label,dt,dd';
  var IMG_SEL = 'img,.img-placeholder,.visit-teaser-img,.hero-photo-area';
  var LINK_SEL = 'a.btn,a.nav-link,a.involve-row';
  var SECTION_SEL = 'section,[data-screen-label],.info-strip,footer';

  function hasEditableAncestor(el, list) {
    var p = el.parentElement;
    while (p) {
      if (list.indexOf(p) !== -1) return true;
      p = p.parentElement;
    }
    return false;
  }
  function visibleText(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function collect() {
    var texts = [], images = [], links = [], sections = [];

    // text blocks — outermost only, so innerHTML (incl. <em>,<br>) is edited as one unit
    var tCands = Array.prototype.slice.call(document.querySelectorAll(TEXT_SEL));
    tCands = tCands.filter(function (el) {
      if (ROOT_SKIP.indexOf(el.tagName) !== -1) return false;
      if (el.closest('#cms-bar,#cms-pop,.cms-ctrl')) return false;
      if (!visibleText(el)) return false;
      return true;
    });
    tCands.forEach(function (el) {
      if (!hasEditableAncestor(el, tCands)) texts.push(el);
    });

    // images / placeholders
    Array.prototype.slice.call(document.querySelectorAll(IMG_SEL)).forEach(function (el) {
      if (el.closest('#cms-bar,#cms-pop')) return;
      // skip a placeholder that merely wraps a deeper placeholder
      images.push(el);
    });

    // links (for href editing)
    Array.prototype.slice.call(document.querySelectorAll(LINK_SEL)).forEach(function (el) {
      links.push(el);
    });

    // sections
    Array.prototype.slice.call(document.querySelectorAll(SECTION_SEL)).forEach(function (el) {
      if (el.closest('#cms-bar')) return;
      sections.push(el);
    });

    return { texts: texts, images: images, links: links, sections: sections };
  }

  // ---- apply an image override to any element (img or background) ----
  function applyImage(el, url) {
    if (!url) return;
    if (el.tagName === 'IMG') {
      el.src = url;
    } else {
      el.style.backgroundImage = 'url("' + url + '")';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.classList.add('cms-has-img');
      // hide placeholder scaffolding inside
      Array.prototype.slice.call(el.querySelectorAll('svg,span')).forEach(function (n) {
        if (!n.closest('.cms-ctrl')) n.style.display = 'none';
      });
    }
  }

  // ---- apply a whole saved overrides object ----
  function applyEdits(edits) {
    if (!edits) return;
    var byKey = {};
    var all = collect();
    function index(list) { list.forEach(function (el) { var k = keyFor(el); if (k) (byKey[k] = byKey[k] || []).push(el); }); }
    index(all.texts); index(all.images); index(all.links); index(all.sections);

    function each(map, fn) { if (map) Object.keys(map).forEach(function (k) { (byKey[k] || []).forEach(function (el) { fn(el, map[k]); }); }); }

    each(edits.text, function (el, html) { el.innerHTML = html; });
    each(edits.img, function (el, url) { applyImage(el, url); });
    each(edits.href, function (el, url) { if (url) el.setAttribute('href', url); });
    each(edits.style, function (el, s) {
      if (s.background) el.style.background = s.background;
      if (s.color) el.style.color = s.color;
    });
    each(edits.hidden, function (el, v) { if (v) el.style.display = 'none'; });

    // added blocks: { containerKey: [ {type,html|src,id} ] }
    if (edits.added) {
      Object.keys(edits.added).forEach(function (ck) {
        var host = (byKey[ck] || [])[0];
        if (!host) return;
        edits.added[ck].forEach(function (b) {
          if (host.querySelector('[data-cms="' + b.id + '"]')) return;
          var node = buildBlock(b);
          host.appendChild(node);
        });
      });
    }
  }

  function buildBlock(b) {
    var node;
    if (b.type === 'image') {
      node = document.createElement('div');
      node.className = 'img-placeholder cms-added';
      node.style.minHeight = '220px';
      node.style.borderRadius = '12px';
      if (b.src) { node.style.backgroundImage = 'url("' + b.src + '")'; node.style.backgroundSize = 'cover'; node.style.backgroundPosition = 'center'; }
      else { node.innerHTML = '<span>New image — click to upload</span>'; }
    } else {
      node = document.createElement('p');
      node.className = 't-body cms-added';
      node.innerHTML = b.html || 'New text block';
    }
    node.setAttribute('data-cms', b.id);
    return node;
  }

  window.OASIS = window.OASIS || {};
  window.OASIS.keyFor = keyFor;
  window.OASIS.collect = collect;
  window.OASIS.applyEdits = applyEdits;
  window.OASIS.applyImage = applyImage;
  window.OASIS.buildBlock = buildBlock;
})();
