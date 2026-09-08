'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { asset } from '@/lib/basePath';
import { getSupabaseBrowserClient, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
import { loadScriptSequence } from '@/lib/scriptLoader';

export default function CmsBridge() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  useEffect(() => {
    // DOM overrides belong to one document. A fresh document prevents retained
    // header edits and editor listeners from leaking into another route.
    if (previousPath.current !== pathname) {
      window.location.reload();
      return;
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
      if (cancelled || !data?.edits) return;
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
