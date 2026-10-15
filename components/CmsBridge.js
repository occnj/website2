'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { asset } from '@/lib/basePath';
import { getSupabaseBrowserClient, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import { loadScriptSequence } from '@/lib/scriptLoader';

// True once this document has visual-editor changes applied (or the editor
// loaded). Those changes edit React's DOM directly, so a page that has them
// must be left with a real page load: client-side navigation would keep its
// header/footer edits and can trip over the nodes the editor inserted.
let pageModified = false;

// Follow internal links with a normal page load while the page is modified.
// Pages without visual edits keep fast in-place navigation.
function onLinkClick(e) {
  if (!pageModified || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return; // same page / #section
  e.preventDefault();
  e.stopPropagation();
  window.location.assign(url.href);
}

function hasEdits(edits) {
  if (!edits || typeof edits !== 'object') return false;
  return Object.values(edits).some((v) => (v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v));
}

export default function CmsBridge() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  useEffect(() => {
    document.addEventListener('click', onLinkClick, true);
    return () => document.removeEventListener('click', onLinkClick, true);
  }, []);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      // Reached a new route in place (Back/Forward, or code navigation) while
      // the previous page carried visual edits: start a fresh document. This
      // used to happen on EVERY navigation, so each click rendered the page and
      // then reloaded it — the flash/jump people saw.
      if (pageModified) {
        window.location.reload();
        return;
      }
    }
    if (pathname.startsWith('/admin')) return;
    let cancelled = false;
    let observer;
    const sb = getSupabaseBrowserClient();
    window.OASIS_SUPABASE = sb;
    window.OASIS_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY };

    loadScriptSequence([asset('/cms-core.js')]).then(async () => {
      if (cancelled || !window.OASIS) return;
      let editMode = new URLSearchParams(window.location.search).get('edit') === '1';
      try { editMode ||= localStorage.getItem('oasis_edit') === '1'; } catch {}
      if (editMode) {
        pageModified = true;
        await loadScriptSequence([asset('/editor.js')]);
        return;
      }
      if (!sb) return;
      const parts = pathname.split('/').filter(Boolean);
      const slug = parts.join('/') || 'index';
      let { data, error } = await sb.from('page_overrides').select('edits').eq('slug', slug).maybeSingle();
      if (!error && !data && parts.length > 1) {
        ({ data, error } = await sb.from('page_overrides').select('edits').eq('slug', parts.at(-1)).maybeSingle());
      }
      if (error) throw error;
      if (cancelled || !hasEdits(data?.edits)) return;
      pageModified = true;
      const apply = () => {
        observer?.disconnect();
        window.OASIS.applyEdits(data.edits);
        observer.observe(document.body, { subtree: true, childList: true, characterData: true });
      };
      observer = new MutationObserver(apply);
      apply();
    }).catch((error) => console.error('Could not load visual content:', error));

    return () => { cancelled = true; observer?.disconnect(); };
  }, [pathname]);

  return null;
}
