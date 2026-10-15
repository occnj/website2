'use client';

import { useEffect, useState } from 'react';
import { useSiteData } from './SiteDataContext';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { isLiveInBrowser } from '@/lib/serviceWindow';

// Live state for open pages. The settings in SiteDataContext are fixed when the
// page loads, so a "Force LIVE" (or a schedule change) saved in the admin
// afterwards never reached an open page until it was refreshed. One shared
// poll re-reads the live settings every 30 seconds (and when the tab comes
// back into view), and every subscriber re-checks the clock every 15 seconds.

const FIELDS = 'live_mode, live_day, live_start, live_end';
let latest = null;        // freshest live settings from the database
let subscribers = new Set();
let pollTimer = 0;
let fetching = false;

async function refresh() {
  if (fetching) return;
  const sb = getSupabaseBrowserClient();
  if (!sb) return;
  fetching = true;
  try {
    const { data, error } = await sb.from('site_settings').select(FIELDS).eq('id', 1).maybeSingle();
    if (!error && data) {
      latest = data;
      subscribers.forEach((fn) => fn());
    }
  } catch { /* offline: keep the last known settings */ }
  finally { fetching = false; }
}

function onVisible() { if (document.visibilityState === 'visible') refresh(); }

function subscribe(fn) {
  subscribers.add(fn);
  if (subscribers.size === 1) {
    pollTimer = setInterval(refresh, 30 * 1000);
    document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) {
      clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisible);
    }
  };
}

export default function useLiveNow(initial = false) {
  const { settings } = useSiteData();
  const [live, setLive] = useState(!!initial);

  useEffect(() => {
    const check = () => setLive(isLiveInBrowser({ ...(settings || {}), ...(latest || {}) }));
    check();
    const unsubscribe = subscribe(check);
    const tick = setInterval(check, 15 * 1000);
    return () => { unsubscribe(); clearInterval(tick); };
  }, [settings]);

  return live;
}
