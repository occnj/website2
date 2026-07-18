-- ============================================================================
--  OASIS WEBSITE — MIGRATIONS (July 2026)
--  Run these in the Supabase SQL editor if you set up the DB from the
--  original supabase-setup.sql and haven't added these columns yet.
--  Every statement is idempotent (safe to run more than once).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Podcast section toggle (Watch page)
--    The "Subscribe to the Oasis Podcast" section on /watch is hidden unless
--    this is true. Toggled from Admin → Navigation & Footer → Site info.
-- ----------------------------------------------------------------------------
alter table site_settings
  add column if not exists podcast_enabled boolean default false;

-- ----------------------------------------------------------------------------
-- 2. Twitch channel override (optional)
--    The live player on /watch defaults to the "occnj" Twitch channel (set in
--    components/TwitchEmbed.js). Setting a value here overrides it without a
--    code deploy. Leave null/empty to use the default.
-- ----------------------------------------------------------------------------
alter table site_settings
  add column if not exists twitch_channel text default '';

-- ----------------------------------------------------------------------------
-- 3. Live player — tabbed Twitch / YouTube / Facebook embed
-- ----------------------------------------------------------------------------
alter table site_settings add column if not exists facebook_page_id text default '';
alter table site_settings add column if not exists youtube_channel text default '';
alter table site_settings add column if not exists live_default_tab text default 'twitch';
--    Public upcoming-events now sort by starts_at, then sort_order. New events
--    added in Admin may have a null sort_order; that's fine, Postgres sorts
--    nulls last for the secondary key. Nothing to run here.
-- ----------------------------------------------------------------------------

-- ============================================================================
--  Verify:
--    select podcast_enabled, twitch_channel from site_settings where id = 1;
-- ============================================================================
