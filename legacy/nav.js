/* Shared Navigation + Footer Component */
(function() {

const LOGO = `<a href="index.html" class="header-logo">
  <img src="uploads/logo-1776793086472.png" alt="Oasis Christian Centre">
  <span>Oasis Christian Centre<span class="logo-sub">Rahway, NJ</span></span>
</a>`;

const NAV_LINKS = [
  { label: 'About', href: 'about.html' },
  { label: 'Plan Your Visit', href: 'plan-your-visit.html' },
  { label: 'Watch', href: 'watch.html' },
  {
    label: 'Next Steps', href: '#', dropdown: [
      { label: 'Teams', sub: 'Serve & volunteer', href: 'about.html#ministries' },
      { label: 'Circles', sub: 'Small groups', href: 'index.html#circles' },
      { label: 'Prayer', sub: 'Request prayer', href: 'contact.html' },
      { label: 'Life Events', sub: 'Baptism & more', href: 'life-events.html' },
    ]
  },
  { label: 'Events', href: 'events.html' },
  { label: 'Leadership', href: 'leadership.html' },
  { label: 'Contact', href: 'contact.html' },
];

function buildDesktopNav() {
  return NAV_LINKS.map(link => {
    if (link.dropdown) {
      const ddItems = link.dropdown.map(d => `
        <a href="${d.href}">
          <strong style="display:block;font-size:.88rem;font-weight:500">${d.label}</strong>
        </a>`).join('');
      return `<div class="nav-item">
        <a href="${link.href}" class="nav-link">
          ${link.label}
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 10L3 5h10z"/></svg>
        </a>
        <div class="nav-dropdown">${ddItems}</div>
      </div>`;
    }
    return `<div class="nav-item"><a href="${link.href}" class="nav-link">${link.label}</a></div>`;
  }).join('');
}

function buildMobileNav() {
  return NAV_LINKS.map(link => {
    if (link.dropdown) {
      const subs = link.dropdown.map(d => `<a href="${d.href}" class="mobile-sub">${d.label}</a>`).join('');
      return `<a href="${link.href}">${link.label}</a>${subs}`;
    }
    return `<a href="${link.href}">${link.label}</a>`;
  }).join('');
}

const HEADER_HTML = `
<header class="site-header" id="site-header">
  <div class="header-inner">
    ${LOGO}
    <nav class="primary-nav">${buildDesktopNav()}</nav>
    <div class="header-cta">
      <a href="give.html" class="btn btn-amber btn-sm" data-give>Give</a>
      <button class="nav-toggle" id="nav-toggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>
<nav class="mobile-nav" id="mobile-nav">
  ${buildMobileNav()}
  <div class="mobile-cta flex" style="gap:12px;flex-wrap:wrap">
    <a href="give.html" class="btn btn-amber full-w" data-give>Give</a>
    <a href="plan-your-visit.html" class="btn btn-secondary full-w">Plan Your Visit</a>
  </div>
</nav>`;

const FOOTER_HTML = `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="uploads/logo-1776793086472.png" alt="Oasis">
          <span class="footer-logo-text">Oasis Christian Centre</span>
        </div>
        <p class="footer-tagline">Know God. Find Hope. Make a Difference.</p>
        <p style="font-size:.82rem;opacity:.6;line-height:1.6">
          15 Main St, Rahway, NJ 07065<br>
          Sunday Service: 10:00 AM
        </p>
        <div style="display:flex;gap:10px;margin-top:20px">
          <a href="#" style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,.1);display:grid;place-items:center;font-size:.8rem;opacity:.7;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.7">fb</a>
          <a href="#" style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,.1);display:grid;place-items:center;font-size:.8rem;opacity:.7;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.7">ig</a>
          <a href="#" style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,.1);display:grid;place-items:center;font-size:.8rem;opacity:.7;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.7">yt</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Visit</h4>
        <ul>
          <li><a href="plan-your-visit.html">Plan Your Visit</a></li>
          <li><a href="plan-your-visit.html">Service Times</a></li>
          <li><a href="https://maps.google.com/?q=Oasis+Christian+Centre+Rahway+NJ" target="_blank" rel="noopener">Directions</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Connect</h4>
        <ul>
          <li><a href="about.html#ministries">Teams</a></li>
          <li><a href="index.html#circles">Circles</a></li>
          <li><a href="contact.html">Prayer Request</a></li>
          <li><a href="life-events.html">Life Events</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Resources</h4>
        <ul>
          <li><a href="watch.html">Watch Messages</a></li>
          <li><a href="events.html">Events</a></li>
          <li><a href="leadership.html">Leadership</a></li>
          <li><a href="give.html">Give</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2026 Oasis Christian Centre, Rahway, NJ. All rights reserved.</span>
      <span>Built with care for the community.</span>
    </div>
  </div>
</footer>`;

function initNav() {
  // Inject header + footer
  const headerEl = document.getElementById('header-mount');
  const footerEl = document.getElementById('footer-mount');
  if (headerEl) headerEl.outerHTML = HEADER_HTML;
  if (footerEl) footerEl.outerHTML = FOOTER_HTML;

  // Scroll behavior
  window.addEventListener('scroll', () => {
    const h = document.getElementById('site-header');
    if (h) h.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile toggle
  document.addEventListener('click', e => {
    const toggle = e.target.closest('#nav-toggle');
    if (toggle) {
      const nav = document.getElementById('mobile-nav');
      if (nav) nav.classList.toggle('open');
      toggle.classList.toggle('active');
    }
  });

  // Active nav
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .mobile-nav > a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNav);
} else {
  initNav();
}

})();
