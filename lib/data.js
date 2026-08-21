import { getSupabaseAdminClient, getSupabaseServerClient } from './supabase';

// Server-side data fetchers used by Server Components. Each fails silently
// (returns a safe empty default) so pages still render their static content
// if Supabase is unreachable or a table/row doesn't exist yet.

export async function getFaqs() {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('faqs')
      .select('*')
      .eq('published', true)
      .order('sort_order');
    return data || [];
  } catch {
    return [];
  }
}

export async function getSiteSettings() {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb.from('site_settings').select('*').eq('id', 1).single();
    return data || null;
  } catch {
    return null;
  }
}

export async function getFormSettings() {
  try {
    const sb = getSupabaseAdminClient();
    if (!sb) return null;
    const { data } = await sb.from('form_settings').select('*').eq('id', 1).single();
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

export async function getTeamSections() {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('team_sections')
      .select('*')
      .eq('published', true)
      .order('sort_order');
    return data || [];
  } catch {
    // Table may not exist yet (migration not run) — signal "no sections" so the
    // About page falls back to a single flat grid instead of crashing.
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
      .order('starts_at')
      .order('sort_order', { nullsFirst: false });
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

export async function getMinistries() {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('ministries')
      .select('*')
      .eq('published', true)
      .order('sort_order');
    return data || [];
  } catch {
    return [];
  }
}

export async function getMinistryBySlug(slug) {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('ministries')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();
    return data || null;
  } catch {
    return null;
  }
}

export async function getMinistryPosts(ministryId) {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('ministry_posts')
      .select('id, title, slug, body, image_url, published_at, published')
      .eq('ministry_id', ministryId)
      .eq('published', true)
      .order('published_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export async function getMinistryPost(postId) {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('ministry_posts')
      .select('*, ministries(name, slug, color)')
      .eq('id', postId)
      .eq('published', true)
      .single();
    return data || null;
  } catch {
    return null;
  }
}

// Look up a post by its human-readable slug within a ministry.
// Falls back to id lookup so old UUID links still work.
export async function getMinistryPostBySlug(ministryId, slugOrId) {
  try {
    const sb = getSupabaseServerClient();
    // Try slug first
    const { data: bySlug } = await sb
      .from('ministry_posts')
      .select('*, ministries(name, slug, color)')
      .eq('ministry_id', ministryId)
      .eq('slug', slugOrId)
      .eq('published', true)
      .single();
    if (bySlug) return bySlug;
    // Fall back to id (backward-compat for existing UUID links)
    const { data: byId } = await sb
      .from('ministry_posts')
      .select('*, ministries(name, slug, color)')
      .eq('id', slugOrId)
      .eq('published', true)
      .single();
    return byId || null;
  } catch {
    return null;
  }
}
