import { getSupabaseServerClient } from './supabase';

// Server-side data fetchers used by Server Components. Each fails silently
// (returns a safe empty default) so pages still render their static content
// if Supabase is unreachable or a table/row doesn't exist yet.

export async function getSiteSettings() {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb.from('site_settings').select('*').eq('id', 1).single();
    return data || null;
  } catch {
    return null;
  }
}

export async function getNavItems() {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('nav_items')
      .select('*')
      .eq('area', 'main')
      .eq('visible', true)
      .order('sort_order');
    return data || [];
  } catch {
    return [];
  }
}

export async function getPageHero(slug) {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('page_blocks')
      .select('block_key, content, visible, pages!inner(slug)')
      .eq('pages.slug', slug);
    const hero = (data || []).find((b) => b.block_key === 'hero' && b.visible);
    return hero ? hero.content || {} : null;
  } catch {
    return null;
  }
}

export async function getTeamMembers() {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('team_members')
      .select('*')
      .eq('published', true)
      .order('sort_order');
    return data || [];
  } catch {
    return [];
  }
}

export async function getUpcomingEvents() {
  try {
    const sb = getSupabaseServerClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await sb
      .from('events')
      .select('*')
      .eq('published', true)
      .gte('starts_at', today)
      .order('sort_order')
      .order('starts_at');
    return data || [];
  } catch {
    return [];
  }
}

export async function getSermons() {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('sermons')
      .select('*')
      .eq('hidden', false)
      .order('published_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}
