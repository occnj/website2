'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { asset } from '@/lib/basePath';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { loadScriptSequence } from '@/lib/scriptLoader';

// Matches the `pages.slug` values in supabase-setup.sql — usePathname()
// already excludes basePath, so '/' -> 'index', '/about' -> 'about', etc.
function slugFromPathname(pathname) {
  const parts = (pathname || '/').split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'index';
}

export default function CmsBridge() {
  const pathname = usePathname();
  const editMode = useRef(false);

  useEffect(() => {
    editMode.current =
      /(?:\?|&)edit=1\b/.test(window.location.search) ||
      localStorage.getItem('oasis_edit') === '1';
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    let cancelled = false;

    loadScriptSequence([asset('/cms-core.js')]).then(async () => {
      if (cancelled || !window.OASIS) return;

      if (editMode.current) {
        // editor.js loads its own overrides and activates the edit UI.
        await loadScriptSequence([
          'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
          asset('/editor.js'),
        ]);
        return;
      }

      const slug = slugFromPathname(pathname);
      const sb = getSupabaseBrowserClient();
      const { data } = await sb.from('page_overrides').select('edits').eq('slug', slug).single();
      if (!cancelled && data && data.edits) window.OASIS.applyEdits(data.edits);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
