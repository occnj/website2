'use client';

import { useEffect } from 'react';
import { loadScriptSequence } from '@/lib/scriptLoader';
import { asset } from '@/lib/basePath';

const TITLES = {
  dashboard: 'Dashboard', pages: 'Pages', sermons: 'Sermons', events: 'Events',
  team: 'Leadership Team', give: 'Giving', navigation: 'Navigation & Site Info',
  media: 'Media Library', users: 'Users & Roles',
};

export default function AdminPage() {
  useEffect(() => {
    let cancelled = false;

    loadScriptSequence([
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
      asset('/admin/config.js'),
      asset('/admin/db.js'),
      asset('/admin/views.js'),
      asset('/admin/actions.js'),
    ]).then(() => {
      if (cancelled) return;
      initAdminController();
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <link rel="stylesheet" href={asset('/admin/admin.css')} />
      <style>{`a { color: var(--blue); } a:hover { color: var(--blue-dark); }`}</style>

      <div className="login-screen" id="login-screen">
        <div className="login-card">
          <div className="brand">
            <img src={asset('/uploads/logo-1776793086472.png')} alt="Oasis" />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.1rem' }}>Oasis Admin</div>
              <div style={{ fontSize: '.68rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--amber)', fontWeight: 600 }}>Content Manager</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Username or email</label>
            <input className="form-input" type="text" id="login-user" placeholder="Oasis" autoComplete="username" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" id="login-pass" autoComplete="current-password" />
          </div>
          <div id="login-error" style={{ display: 'none', color: 'var(--red)', fontSize: '.8rem', marginBottom: 10 }}></div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} id="login-btn" onClick={() => window.__adminLogin && window.__adminLogin()}>Sign In</button>
          <div className="supabase-note" id="supabase-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#3ECF8E"><path d="M13 2 3 14h8l-1 8L21 10h-8z"></path></svg>
            Secured by Supabase Auth
          </div>
        </div>
      </div>

      <div className="admin-shell" id="admin-shell" style={{ display: 'none' }}>
        <div className="sidebar-backdrop" id="sidebar-backdrop" onClick={() => window.__adminToggleSidebar && window.__adminToggleSidebar(false)}></div>
        <aside className="sidebar" id="sidebar">
          <div className="sidebar-brand">
            <img src={asset('/uploads/logo-1776793086472.png')} alt="Oasis" />
            <div className="sidebar-brand-text"><strong>Oasis Admin</strong><span>Content Manager</span></div>
          </div>
          <nav className="sidebar-nav" id="sidebar-nav">
            <div className="sidebar-heading">Overview</div>
            <button className="side-link" data-view="dashboard">Dashboard</button>
            <div className="sidebar-heading" data-role="content">Content</div>
            <button className="side-link" data-view="pages" data-role="content">Pages</button>
            <button className="side-link" data-view="sermons" data-role="content">Sermons</button>
            <button className="side-link" data-view="events">Events</button>
            <button className="side-link" data-view="team" data-role="content">Team</button>
            <button className="side-link" data-view="give" data-role="content">Giving</button>
            <div className="sidebar-heading" data-role="content">Site</div>
            <button className="side-link" data-view="navigation" data-role="content">Navigation</button>
            <button className="side-link" data-view="media" data-role="content">Media</button>
            <div className="sidebar-heading" data-role="admin">Settings</div>
            <button className="side-link" data-view="users" data-role="admin">Users &amp; Roles</button>
          </nav>
          <div className="sidebar-foot">
            <div className="avatar" id="me-avatar">·</div>
            <div className="sidebar-foot-text"><strong id="me-name">—</strong><span id="me-role"></span></div>
          </div>
        </aside>

        <div className="admin-main">
          <div className="topbar">
            <button className="menu-btn" onClick={() => window.__adminToggleSidebar && window.__adminToggleSidebar()} aria-label="Menu"><span></span><span></span><span></span></button>
            <h1 id="topbar-title">Dashboard</h1>
            <div className="topbar-actions">
              <a className="btn btn-sm btn-outline" href={asset('/')} target="_blank">View Live Site ↗</a>
              <button className="btn btn-sm btn-outline" onClick={() => window.__adminLogout && window.__adminLogout()}>Sign Out</button>
            </div>
          </div>
          <div id="view-container"></div>
        </div>
      </div>

      <div className="modal-backdrop" id="editor-modal" onClick={(e) => { if (e.target === e.currentTarget && window.closeEditor) window.closeEditor(); }}>
        <div className="modal">
          <div className="panel-head"><div><h3 id="editor-title">Edit</h3></div>
            <button className="icon-btn" onClick={() => window.closeEditor && window.closeEditor()} aria-label="Close">✕</button>
          </div>
          <div className="panel-body" id="editor-body"></div>
          <div className="panel-body" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button className="btn btn-outline" onClick={() => window.closeEditor && window.closeEditor()}>Cancel</button>
            <button className="btn btn-primary" onClick={() => window.saveEditor && window.saveEditor()}>Save</button>
          </div>
        </div>
      </div>

      <div className="modal-backdrop" id="confirm-modal" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('open'); }}>
        <div className="modal" style={{ maxWidth: 420 }}>
          <div className="panel-body">
            <h3 style={{ fontFamily: 'var(--font-head)', marginBottom: 8 }}>Are you sure?</h3>
            <p id="confirm-msg" style={{ fontSize: '.88rem', color: 'var(--gray-1)' }}></p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn btn-outline" onClick={() => document.getElementById('confirm-modal').classList.remove('open')}>Cancel</button>
              <button className="btn" style={{ background: 'var(--red)', color: '#fff' }} onClick={() => window.runConfirm && window.runConfirm()}>Yes, continue</button>
            </div>
          </div>
        </div>
      </div>

      <div className="toast" id="toast"><span className="check">✓</span><span id="toast-msg"></span></div>
    </>
  );
}

function initAdminController() {
  if (window.__adminInitDone) {
    // Already initialized (e.g. fast refresh) — just re-check session.
    if (window.DB && window.DB.connected) {
      window.DB.client.auth.getSession().then((res) => {
        if (res.data.session) window.__adminShowShell();
      });
    }
    return;
  }
  window.__adminInitDone = true;

  const container = document.getElementById('view-container');

  async function go(name) {
    document.querySelectorAll('.side-link').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === name);
    });
    document.getElementById('topbar-title').textContent = TITLES[name] || name;
    container.innerHTML = '<div class="view active"><div class="panel"><div class="panel-body" style="color:var(--gray-1)">Loading…</div></div></div>';
    toggleSidebar(false);
    localStorage.setItem('oasis-admin-view', name);
    const html = await window.VIEWS[name]();
    container.innerHTML = '<div class="view active" data-screen-label="' + (TITLES[name] || name) + '">' + html + '</div>';
    window.scrollTo(0, 0);
  }
  window.go = go;

  document.querySelectorAll('.side-link').forEach((b) => {
    b.addEventListener('click', () => go(b.dataset.view));
  });

  function toggleSidebar(force) {
    const sb = document.getElementById('sidebar');
    const open = force !== undefined ? force : !sb.classList.contains('open');
    sb.classList.toggle('open', open);
    document.getElementById('sidebar-backdrop').classList.toggle('show', open);
  }
  window.__adminToggleSidebar = toggleSidebar;

  function loginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.style.display = 'block';
  }

  async function showShell() {
    const me = await DB.loadProfile();
    if (!me) {
      loginError('Your account exists but has no profile row yet. An administrator must add you in Users & Roles (or run the profiles insert in supabase-setup.sql).');
      await DB.client.auth.signOut();
      return;
    }
    if (!me.active) {
      loginError('This account has been suspended. Contact an administrator.');
      await DB.client.auth.signOut();
      return;
    }
    const isAdmin = ['owner', 'admin'].indexOf(me.role) >= 0;
    const isEditor = isAdmin || me.role === 'editor';
    document.querySelectorAll('[data-role="admin"]').forEach((el) => { el.style.display = isAdmin ? '' : 'none'; });
    document.querySelectorAll('[data-role="content"]').forEach((el) => { el.style.display = isEditor ? '' : 'none'; });
    document.getElementById('me-name').textContent = me.full_name || me.email;
    document.getElementById('me-role').textContent = me.role === 'owner' ? 'Owner' : me.role;
    document.getElementById('me-avatar').textContent = (me.full_name || me.email || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-shell').style.display = 'flex';
    const last = localStorage.getItem('oasis-admin-view') || 'dashboard';
    go((isEditor || last === 'events') ? last : 'dashboard');
  }
  window.__adminShowShell = showShell;

  async function login() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    document.getElementById('login-error').style.display = 'none';
    if (!DB.connected) { loginError('Supabase is not configured — add keys in admin/config.js.'); return; }
    const CFG = window.OASIS_CONFIG;
    const email = (user.toLowerCase() === (CFG.ADMIN_USERNAME || '').toLowerCase()) ? CFG.ADMIN_EMAIL : user;
    const btn = document.getElementById('login-btn');
    btn.textContent = 'Signing in…'; btn.disabled = true;
    const { error } = await DB.client.auth.signInWithPassword({ email, password: pass });
    btn.textContent = 'Sign In'; btn.disabled = false;
    if (error) { loginError('Sign-in failed: ' + error.message); return; }
    showShell();
  }
  window.__adminLogin = login;

  async function logout() {
    if (DB.connected) await DB.client.auth.signOut();
    location.reload();
  }
  window.__adminLogout = logout;

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.classList.remove('show'); }, 2600);
  }
  window.toast = toast;

  document.getElementById('login-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });

  if (window.DB && window.DB.connected) {
    window.DB.client.auth.getSession().then((res) => {
      if (res.data.session) showShell();
    });
  } else {
    const note = document.getElementById('supabase-note');
    if (note) note.innerHTML = '<span style="color:var(--amber);font-weight:600">Not configured</span>&nbsp;— add Supabase keys in admin/config.js';
  }
}
