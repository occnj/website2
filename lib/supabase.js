import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://twdyeqnlxzvanylhqnjf.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZHllcW5seHp2YW55bGhxbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NzUxNjMsImV4cCI6MjA5OTU1MTE2M30.OHzwlusEyT1CMeyTG3RWR45UutTD7IgRhJXEWWHUYyU';

let browserClient;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}

export function getSupabaseServerClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}
