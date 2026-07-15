// Oasis — public site hydration from Supabase
// Loads content managed in the admin panel. Falls back silently to the
// static HTML if Supabase is unreachable or a table is empty.
(function () {
  var CFG = window.OASIS_CONFIG || {
    SUPABASE_URL: 'https://twdyeqnlxzvanylhqnjf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZHllcW5seHp2YW55bGhxbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NzUxNjMsImV4cCI6MjA5OTU1MTE2M30.OHzwlusEyT1CMeyTG3RWR45UutTD7IgRhJXEWWHUYyU',
  };
  if (!window.supabase) return;
  var sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  var slug = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function txt(sel, value) {
    if (value == null || value === '') return;
    var el = document.querySelector(sel);
    if (el) el.textContent = value;
  }

  // ---- Site settings: give links, footer info ----
  function applyGive(s) {
    if (!s.donate_url) return;
    var tries = 0;
    (function apply() {
      var els = document.querySelectorAll('a[data-give], #give-btn');
      if (!els.length && tries++ < 30) return setTimeout(apply, 100);
      els.forEach(function (a) {
        a.href = s.donate_url;
        if (s.donate_new_tab) { a.target = '_blank'; a.rel = 'noopener'; }
      });
    })();
  }
  sb.from('site_settings').select('*').eq('id', 1).single().then(function (res) {
    var s = res.data;
    if (!s) return;
    applyGive(s);
    document.querySelectorAll('[data-site="phone"]').forEach(function (el) { if (s.phone) el.textContent = s.phone; });
    document.querySelectorAll('[data-site="address"]').forEach(function (el) { if (s.address) el.textContent = s.address; });
    document.querySelectorAll('[data-site="email"]').forEach(function (el) { if (s.email) el.textContent = s.email; });
    document.querySelectorAll('[data-site="service_time"]').forEach(function (el) { if (s.service_time) el.textContent = s.service_time; });
  });

  // ---- Navigation (header is injected by nav.js; wait for it, capped retries) ----
  sb.from('nav_items').select('*').eq('area', 'main').eq('visible', true).order('sort_order').then(function (res) {
    var items = res.data;
    if (!items || !items.length) return;
    var current = location.pathname.split('/').pop() || 'index.html';
    var tries = 0;
    function apply() {
      var nav = document.querySelector('nav.primary-nav');
      var mobile = document.getElementById('mobile-nav');
      if (!nav) {
        if (tries++ < 30) setTimeout(apply, 100);
        return;
      }
      // Keep the "Next Steps" dropdown nav.js built; rebuild the plain links around it
      var dropdown = nav.querySelector('.nav-dropdown');
      var dropdownItem = dropdown ? dropdown.closest('.nav-item') : null;
      nav.innerHTML = '';
      items.forEach(function (n, i) {
        // re-insert the dropdown in its original mid position
        if (dropdownItem && i === Math.min(3, items.length)) nav.appendChild(dropdownItem);
        var div = document.createElement('div');
        div.className = 'nav-item';
        div.innerHTML = '<a class="nav-link' + (n.href === current ? ' active' : '') + '"></a>';
        var a = div.firstChild;
        a.href = n.href;
        a.textContent = n.label;
        nav.appendChild(div);
      });
      if (dropdownItem && items.length < 3) nav.appendChild(dropdownItem);
      // Mobile nav: rebuild plain links, keep subs + CTA block
      if (mobile) {
        var keep = [];
        mobile.querySelectorAll('.mobile-sub, .mobile-cta').forEach(function (el) { keep.push(el); });
        mobile.querySelectorAll(':scope > a:not(.mobile-sub)').forEach(function (el) { el.remove(); });
        var anchor = keep.length ? keep[0] : null;
        items.slice().reverse().forEach(function (n) {
          var a = document.createElement('a');
          a.href = n.href;
          a.textContent = n.label;
          if (n.href === current) a.className = 'active';
          mobile.insertBefore(a, anchor || mobile.firstChild);
          anchor = a;
        });
      }
    }
    apply();
  });

  // ---- Inline visual-editor overrides ----
  // Generic, page-wide source of truth for text, images, links, colours and
  // added blocks. Every editable element is keyed by its stable DOM path
  // (see cms-core.js). This replaces the old per-field hero reader.
  function applyOverrides() {
    if (!window.OASIS || !window.OASIS.applyEdits) { return setTimeout(applyOverrides, 60); }
    sb.from('page_overrides').select('edits').eq('slug', slug).single().then(function (res) {
      if (res.data && res.data.edits) {
        try { window.OASIS.applyEdits(res.data.edits); } catch (e) { console.warn('overrides', e); }
      }
    }).catch(function () {});
  }
  applyOverrides();

  // ---- Leadership page ----
  if (slug === 'leadership') {
    sb.from('team_members').select('*').eq('published', true).order('sort_order').then(function (res) {
      var team = res.data || [];
      var grid = document.querySelector('[data-team-list]');
      if (!grid || !team.length) return;
      grid.innerHTML = team.map(function (t) {
        var L = t.links || {};
        var links = [
          L.instagram ? '<a href="' + esc(L.instagram) + '" target="_blank" rel="noopener">Instagram</a>' : '',
          L.facebook ? '<a href="' + esc(L.facebook) + '" target="_blank" rel="noopener">Facebook</a>' : '',
          L.email ? '<a href="mailto:' + esc(L.email) + '">Email</a>' : '',
        ].filter(Boolean).join('');
        return '<div class="leader-card">' +
          '<div class="leader-photo">' +
          (t.photo_url
            ? '<img src="' + esc(t.photo_url) + '" alt="' + esc(t.name) + '" style="width:100%;height:100%;min-height:280px;object-fit:cover;display:block">'
            : '<div class="img-placeholder" style="height:100%;min-height:280px"><span style="font-family:var(--font-head);font-size:2.4rem;color:#9BABB6">' + esc(t.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('')) + '</span></div>') +
          '<div class="leader-photo-overlay"></div></div>' +
          '<div class="leader-info">' +
          '<div class="leader-name">' + esc(t.name) + '</div>' +
          '<div class="leader-role">' + esc(t.role_title) + '</div>' +
          (t.bio ? '<p class="leader-bio">' + esc(t.bio) + '</p>' : '') +
          (links ? '<div style="display:flex;gap:14px;margin-top:10px;font-size:.8rem;font-weight:600">' + links + '</div>' : '') +
          '</div></div>';
      }).join('');
    });
  }

  // ---- Events page ----
  function eventRow(e) {
    var d = new Date(e.starts_at + 'T12:00:00');
    return '<div class="event-full" data-cat="' + esc(e.category || 'community') + '">' +
      '<div class="event-date-col">' +
      '<div class="month">' + d.toLocaleString('en-US', { month: 'short' }) + '</div>' +
      '<div class="day">' + String(d.getDate()).padStart(2, '0') + '</div>' +
      '<div class="dow">' + d.toLocaleString('en-US', { weekday: 'short' }) + '</div></div>' +
      '<div class="event-body">' +
      '<div class="event-cat">' + esc((e.category || 'community').charAt(0).toUpperCase() + (e.category || 'community').slice(1)) + '</div>' +
      '<div class="event-title">' + esc(e.title) + '</div>' +
      '<div class="event-meta-row">' + [e.time_label, e.location].filter(Boolean).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
      (e.description ? '<div class="event-desc">' + esc(e.description) + '</div>' : '') +
      '</div>' +
      (e.registration_url ? '<div class="event-action"><a href="' + esc(e.registration_url) + '" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Register</a></div>' : '') +
      '</div>';
  }
  if (slug === 'events') {
    var today = new Date().toISOString().slice(0, 10);
    sb.from('events').select('*').eq('published', true).gte('starts_at', today)
      .order('sort_order').order('starts_at').then(function (res) {
        var events = res.data || [];
        var target = document.querySelector('[data-events-list]');
        if (!target || !events.length) return;
        // group by month, keep the filter bar
        var filterBar = target.querySelector('.filter-bar');
        var html = filterBar ? filterBar.outerHTML : '';
        var lastMonth = '';
        events.forEach(function (e) {
          var d = new Date(e.starts_at + 'T12:00:00');
          var m = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          if (m !== lastMonth) {
            html += '<div style="font-family:var(--font-head);font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gray-1);margin-bottom:var(--sp-2);margin-top:var(--sp-4)">' + m + '</div>';
            lastMonth = m;
          }
          html += eventRow(e);
        });
        target.innerHTML = html;
      });
  }

  // ---- Watch page sermons ----
  if (slug === 'watch') {
    sb.from('sermons').select('*').eq('hidden', false).order('published_at', { ascending: false }).then(function (res) {
      var sermons = res.data || [];
      if (!sermons.length) return; // keep static content until sermons exist
      var grid = document.querySelector('.sermon-grid');
      if (grid) {
        grid.innerHTML = sermons.slice(0, 12).map(function (s) {
          return '<a class="sermon-card-full" href="https://www.youtube.com/watch?v=' + esc(s.youtube_id) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit" data-cat="' + esc(s.series || '') + '">' +
            '<div class="sermon-thumb">' +
            '<img src="' + esc(s.thumbnail_url || ('https://i.ytimg.com/vi/' + s.youtube_id + '/hqdefault.jpg')) + '" alt="' + esc(s.title) + '" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy">' +
            '<div class="play-overlay"><div class="play-circle"><svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-left:3px"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div></div></div>' +
            '<div class="sermon-body">' +
            (s.series ? '<div class="sermon-series-tag">' + esc(s.series) + '</div>' : '') +
            '<div class="sermon-title">' + esc(s.title) + '</div>' +
            '<div class="sermon-meta">' + [s.speaker, s.published_at ? new Date(s.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''].filter(Boolean).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
            '</div></a>';
        }).join('');
      }
      // Featured sermon embed
      var feat = sermons.find(function (s) { return s.featured; }) || sermons[0];
      var featFrame = document.querySelector('[data-featured-sermon]');
      if (featFrame && feat) {
        featFrame.innerHTML = '<iframe src="https://www.youtube.com/embed/' + esc(feat.youtube_id) + '" title="' + esc(feat.title) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen></iframe>';
        featFrame.style.position = 'relative';
      }
    });
  }
})();
