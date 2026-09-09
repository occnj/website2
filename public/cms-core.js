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
  var UI = '#cms-bar,#cms-pop,#cms-hover,#cms-toast,#cms-text-panel,.cms-ctrl';
  var keys = new WeakMap();
  var knownText = new WeakSet();

  // ---- stable key from an element's position in the tree ----
  function keyFor(el, legacy) {
    if (!el || el.nodeType !== 1) return null;
    if (!legacy && keys.has(el)) return keys.get(el);
    if (el.hasAttribute('data-cms')) return el.getAttribute('data-cms');
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node.tagName !== 'BODY' && node.tagName !== 'HTML') {
      if (!legacy && node.hasAttribute('data-cms-scope')) { parts.unshift('scope:' + node.getAttribute('data-cms-scope')); break; }
      var seg = node.tagName.toLowerCase();
      var p = node.parentNode;
      if (p && p.children) {
        var same = [];
        for (var i = 0; i < p.children.length; i++) {
          if (!p.children[i].matches(UI + ',.cms-added') && p.children[i].tagName === node.tagName) same.push(p.children[i]);
        }
        if (same.length > 1) seg += ':' + (same.indexOf(node) + 1);
      }
      parts.unshift(seg);
      node = node.parentNode;
    }
    var key = parts.join('>');
    if (!legacy) keys.set(el, key);
    return key;
  }

  // ---- which elements are editable ----
  // Instead of a hand-maintained selector whitelist (which missed most
  // span/div-based text), detect text blocks generically: any element that
  // either contains its own text directly, or whose children are all simple
  // inline elements — meaning its innerHTML is safe to edit as one unit.
  // This makes EVERY piece of visible text on every page editable.
  var CLASSIC_TEXT = 'H1,H2,H3,H4,H5,H6,P,LI,BLOCKQUOTE,BUTTON,LABEL,DT,DD,TD,TH,FIGCAPTION';
  var GENERIC_TEXT = 'DIV,SPAN,A,STRONG,EM,B,I,SMALL';
  // inline tags that can safely live inside an editable unit
  var INLINE_SAFE = 'SPAN,STRONG,EM,B,I,U,SMALL,SUP,SUB,MARK,CODE,BR,ABBR,TIME,SVG,PATH,CIRCLE,RECT,POLYGON,LINE';
  var IMG_SEL = 'img,.img-placeholder,.visit-teaser-img,.hero-photo-area';
  var LINK_SEL = 'a[href]';
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
  function hasDirectText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && /\S/.test(n.nodeValue)) return true;
    }
    return false;
  }
  function onlyInlineChildren(el) {
    return Array.prototype.every.call(el.children, function (c) {
      return !c.hasAttribute('data-cms-scope') && !c.hidden && INLINE_SAFE.split(',').indexOf(c.tagName) !== -1 && onlyInlineChildren(c);
    });
  }
  function isTextBlock(el) {
    if (el.closest(UI + ',script,style,noscript,svg,iframe,select,textarea')) return false;
    return !!visibleText(el) && onlyInlineChildren(el) &&
      (hasDirectText(el) || el.children.length > 0);
  }

  // Direct text nodes preserve layout, links, and React event handlers.
  // Also exposes hidden copy and form hints through the editor's All text panel.
  function copyTargets() {
    var targets = [];
    Array.prototype.forEach.call(document.body.querySelectorAll('*'), function (el) {
      if (el.closest(UI + ',script,style,noscript,svg,iframe')) return;
      var n = 0;
      Array.prototype.forEach.call(el.childNodes, function (node) {
        if (node.nodeType !== 3) return;
        var key = keyFor(el) + '::text:' + n++;
        if (!node.nodeValue.trim() && !knownText.has(node)) return;
        knownText.add(node);
        if (el.tagName === 'OPTION' && !el.hasAttribute('value')) el.setAttribute('value', el.value);
        targets.push({ key: key, el: el, get: function () { return node.nodeValue; }, set: function (v) { if (node.nodeValue !== v) node.nodeValue = v; } });
      });
      ['placeholder', 'aria-label', 'title', 'alt'].forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        targets.push({ key: keyFor(el) + '::' + attr, el: el, attribute: attr,
          get: function () { return el.getAttribute(attr); },
          set: function (v) { if (el.getAttribute(attr) !== v) el.setAttribute(attr, v); } });
      });
    });
    return targets;
  }

  function collect() {
    var texts = [], images = [], links = [], sections = [];

    // text blocks — outermost only, so innerHTML (incl. <em>,<br>) is edited as one unit
    var tCands = [];
    Array.prototype.slice.call(document.body.getElementsByTagName('*')).forEach(function (el) {
      if (isTextBlock(el)) tCands.push(el);
    });
    tCands.forEach(function (el) {
      if (!hasEditableAncestor(el, tCands)) texts.push(el);
    });

    // images / placeholders
    Array.prototype.slice.call(document.querySelectorAll(IMG_SEL)).forEach(function (el) {
      if (el.closest(UI)) return;
      // skip a placeholder that merely wraps a deeper placeholder
      images.push(el);
    });

    // links (for href editing)
    Array.prototype.slice.call(document.querySelectorAll(LINK_SEL)).forEach(function (el) {
      if (!el.closest(UI)) links.push(el);
    });

    // sections
    Array.prototype.slice.call(document.querySelectorAll(SECTION_SEL)).forEach(function (el) {
      if (el.closest(UI)) return;
      sections.push(el);
    });

    return { texts: texts, images: images, links: links, sections: sections };
  }

  // ---- apply an image override to any element (img or background) ----
  function applyImage(el, url) {
    if (!url) return;
    if (el.tagName === 'IMG') {
      if (el.getAttribute('src') !== url) el.src = url;
      el.removeAttribute('srcset');
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

  function sanitizeHtml(html) {
    var template = document.createElement('template');
    template.innerHTML = String(html || '');
    Array.prototype.slice.call(template.content.querySelectorAll('script,style,iframe,object,embed,form,input,textarea,button,meta,link')).forEach(function (node) { node.remove(); });
    Array.prototype.slice.call(template.content.querySelectorAll('*')).forEach(function (node) {
      Array.prototype.slice.call(node.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        var value = attr.value.trim().toLowerCase();
        if (name.indexOf('on') === 0 || name === 'srcdoc' || ((name === 'href' || name === 'src' || name === 'xlink:href') && !safeUrl(value))) {
          node.removeAttribute(attr.name);
        }
      });
    });
    return template.innerHTML;
  }

  function safeUrl(url) {
    var value = String(url || '').trim();
    if (!value || /[\u0000-\u0020]/.test(value.replace(/ /g, '')) || (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^(https?:|mailto:|tel:)/i.test(value))) return '';
    return value;
  }

  // ---- content fingerprint used to recover edits after a redesign ----
  // DOM-path keys break when a page is restructured (a paragraph moves, a new
  // wrapper div is inserted, a section is re-nested). When the editor records a
  // text/copy edit it also stores the ORIGINAL text under edits.sig[key]. On
  // apply, if a key no longer resolves to an element, we look for an unclaimed
  // element whose current text still matches that signature and heal onto it.
  // edits.text / edits.copy formats are unchanged, so old published rows (which
  // simply have no sig) keep working exactly as before.
  function sig(text) {
    return String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
  }

  // ---- apply a whole saved overrides object ----
  // Returns a report: { healed:[{key,preview}], orphaned:[{key,preview,reason}] }
  // so the visual editor can tell staff which saved edits could not be placed
  // after a redesign. On the public site the return value is simply ignored.
  function applyEdits(edits) {
    var report = { healed: [], orphaned: [] };
    if (!edits) return report;
    var byKey = {};
    var claimed = new WeakSet(); // elements already matched by an exact key
    function index(list) { list.forEach(function (el) { var k = keyFor(el); if (k) (byKey[k] = byKey[k] || []).push(el); var old = keyFor(el, true); if (old && old !== k) (byKey[old] = byKey[old] || []).push(el); }); }
    index(Array.prototype.filter.call(document.body.querySelectorAll('*'), function (el) { return !el.closest(UI); }));

    function preview(html) {
      var t = String(html == null ? '' : html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      return t.length > 60 ? t.slice(0, 57) + '…' : t;
    }

    // Recover a text/copy target whose key no longer resolves, by matching the
    // saved original content against an as-yet-unclaimed element. Returns the
    // healed element (and marks it claimed) or null if nothing safely matches.
    function recover(key, signatures, readCurrent, intended) {
      if (!signatures || !Object.prototype.hasOwnProperty.call(signatures, key)) {
        report.orphaned.push({ key: key, preview: preview(intended), reason: 'no-signature' });
        if (window.console) console.warn('[OASIS] orphaned edit has no signature to recover from:', key);
        return null;
      }
      var want = sig(signatures[key]);
      if (!want) { report.orphaned.push({ key: key, preview: preview(intended), reason: 'no-signature' }); return null; }
      var hit = null, ambiguous = false, seen = new WeakSet();
      Object.keys(byKey).forEach(function (k) {
        byKey[k].forEach(function (el) {
          if (seen.has(el)) return; // same element is indexed under current + legacy keys
          seen.add(el);
          if (claimed.has(el)) return;
          // Only consider genuine text blocks, so an ancestor whose textContent
          // merely CONTAINS the wording is not treated as a rival match.
          if (!isTextBlock(el)) return;
          if (sig(readCurrent(el)) !== want) return;
          if (hit && hit !== el) ambiguous = true; else hit = el;
        });
      });
      if (!hit || ambiguous) { // don't guess when several elements share the text
        report.orphaned.push({ key: key, preview: preview(intended), reason: ambiguous ? 'ambiguous' : 'not-found' });
        if (ambiguous && window.console) console.warn('[OASIS] orphaned edit not healed (ambiguous match):', key);
        else if (window.console) console.warn('[OASIS] orphaned edit could not be recovered:', key);
        return null;
      }
      claimed.add(hit);
      report.healed.push({ key: key, preview: preview(intended) });
      return hit;
    }

    function each(map, fn) { if (map) Object.keys(map).forEach(function (k) { (byKey[k] || []).forEach(function (el) { claimed.add(el); fn(el, map[k]); }); }); }

    each(edits.text, function (el, html) { var clean = sanitizeHtml(html); if (el.innerHTML !== clean) el.innerHTML = clean; });
    // Heal any text edits whose DOM-path key no longer resolves.
    if (edits.text) Object.keys(edits.text).forEach(function (k) {
      if ((byKey[k] || []).length) return;
      var el = recover(k, edits.sig, function (n) { return n.textContent; }, edits.text[k]);
      if (el) { var clean = sanitizeHtml(edits.text[k]); if (el.innerHTML !== clean) el.innerHTML = clean; }
    });
    each(edits.img, function (el, url) { applyImage(el, url); });
    each(edits.href, function (el, url) { var safe = safeUrl(url); if (safe) el.setAttribute('href', safe); });
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
          if (Array.prototype.some.call(host.querySelectorAll('[data-cms]'), function (el) { return el.getAttribute('data-cms') === b.id; })) return;
          var node = buildBlock(b);
          host.appendChild(node);
          if (edits.text && Object.prototype.hasOwnProperty.call(edits.text, b.id)) node.innerHTML = sanitizeHtml(edits.text[b.id]);
          if (edits.img && edits.img[b.id]) applyImage(node, edits.img[b.id]);
        });
      });
    }
    if (edits.copy) {
      var targets = copyTargets();
      var byTargetKey = {};
      targets.forEach(function (t) { (byTargetKey[t.key] = byTargetKey[t.key] || []).push(t); });
      Object.keys(edits.copy).forEach(function (k) {
        var matches = byTargetKey[k];
        if (matches && matches.length) { matches.forEach(function (t) { t.set(edits.copy[k]); claimed.add(t.el); }); return; }
        // Orphaned copy target: recover by matching saved original text against
        // an unclaimed target's current value (skip attribute targets — their
        // content is not uniquely identifying enough to heal safely).
        if (!edits.sig || !Object.prototype.hasOwnProperty.call(edits.sig, k)) {
          report.orphaned.push({ key: k, preview: preview(edits.copy[k]), reason: 'no-signature' });
          return;
        }
        var want = sig(edits.sig[k]);
        if (!want) { report.orphaned.push({ key: k, preview: preview(edits.copy[k]), reason: 'no-signature' }); return; }
        var hit = null, ambiguous = false;
        targets.forEach(function (t) {
          if (t.attribute || claimed.has(t.el)) return;
          if (sig(t.get()) !== want) return;
          if (hit && hit !== t) ambiguous = true; else hit = t;
        });
        if (hit && !ambiguous) { hit.set(edits.copy[k]); claimed.add(hit.el); report.healed.push({ key: k, preview: preview(edits.copy[k]) }); }
        else {
          report.orphaned.push({ key: k, preview: preview(edits.copy[k]), reason: ambiguous ? 'ambiguous' : 'not-found' });
          if (window.console) console.warn('[OASIS] orphaned copy edit not recovered:', k);
        }
      });
    }
    return report;
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
      node.innerHTML = sanitizeHtml(b.html || 'New text block');
    }
    node.setAttribute('data-cms', b.id);
    return node;
  }

  window.OASIS = window.OASIS || {};
  window.OASIS.keyFor = keyFor;
  window.OASIS.copyTargets = copyTargets;
  window.OASIS.collect = collect;
  window.OASIS.applyEdits = applyEdits;
  window.OASIS.applyImage = applyImage;
  window.OASIS.buildBlock = buildBlock;
  window.OASIS.sanitizeHtml = sanitizeHtml;
  window.OASIS.safeUrl = safeUrl;
})();
