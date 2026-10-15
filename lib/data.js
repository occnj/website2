import { getSupabaseAdminClient, getSupabaseServerClient } from './supabase';
import { churchToday, expandEvents, isRecurring } from './recurrence';

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
    // Two plain queries rather than filtering on an embedded table
    // (pages!inner + .eq('pages.slug')), which PIBASE does not support.
    const { data: page } = await sb.from('pages').select('id').eq('slug', slug).maybeSingle();
    if (!page) return null;
    const { data } = await sb
      .from('page_blocks')
      .select('block_key, content, visible')
      .eq('page_id', page.id)
      .eq('block_key', 'hero');
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

// Upcoming events with repeating events expanded: one row per date (starts_at
// is that date; occurrence_key is unique per date). `months` limits how far
// ahead repeating events are listed.
export async function getUpcomingEvents({ months = 6 } = {}) {
  try {
    const sb = getSupabaseServerClient();
    // All published events: a repeating series may have started in the past.
    // (Filtered here rather than with an OR query so it works on any backend.)
    const { data } = await sb
      .from('events')
      .select('*')
      .eq('published', true)
      .order('starts_at');
    const today = churchToday();
    const t = new Date(today + 'T12:00:00Z');
    const until = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + months + 1, 0)).toISOString().slice(0, 10);
    const rows = (data || []).filter((e) => isRecurring(e) || (e.starts_at && e.starts_at >= today));
    // One-time events are always listed, however far ahead they are.
    const last = rows.reduce((m, e) => (!isRecurring(e) && e.starts_at > m ? e.starts_at : m), until);
    return expandEvents(rows, today, last).filter((e) => !isRecurring(e) || e.starts_at <= until);
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

// The ministry whose posts form the Mission Blog: slug "missions", or failing
// that the first ministry whose slug/name starts with "mission" (so a ministry
// created by hand as e.g. "missions-outreach" still works).
export async function getMissionsMinistry() {
  const exact = await getMinistryBySlug('missions');
  if (exact) return exact;
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb.from('ministries').select('*').eq('published', true).order('sort_order');
    return (data || []).find((m) => /^mission/i.test(m.slug || '') || /^mission/i.test((m.name || '').trim())) || null;
  } catch {
    return null;
  }
}

// For the home page Mission section: the Missions ministry and its latest post.
export async function getMissionsSummary() {
  try {
    const ministry = await getMissionsMinistry();
    if (!ministry) return { ministry: null, post: null };
    const posts = await getMinistryPosts(ministry.id);
    return { ministry, post: posts[0] || null };
  } catch {
    return { ministry: null, post: null };
  }
}

export async function getVolunteerPositions() {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from('volunteer_positions')
      .select('*')
      .eq('published', true)
      .order('sort_order');
    return data || [];
  } catch {
    // Table missing (migration not run) — the Serve page shows a general card.
    return [];
  }
}

// ---- About page content (admin-managed; pages fall back to hardcoded copy) ----
async function listPublished(table) {
  try {
    const sb = getSupabaseServerClient();
    const { data } = await sb
      .from(table)
      .select('*')
      .eq('published', true)
      .order('sort_order');
    return data || [];
  } catch {
    return [];
  }
}

export async function getBeliefs() { return listPublished('beliefs'); }
export async function getCoreValues() { return listPublished('core_values'); }
export async function getAboutHubCards() { return listPublished('about_hub_cards'); }
