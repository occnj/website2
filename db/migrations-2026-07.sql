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
alter table site_settings add column if not exists podcast_apple_url text default '';
alter table site_settings add column if not exists podcast_spotify_url text default '';
alter table site_settings add column if not exists calendar_url text default '';

-- Ensure the Prayer page appears in Admin → Pages and Visual Edit.
insert into pages (slug, title, seo_title, seo_description, published)
values ('prayer', 'Prayer Request', 'Prayer Request — Oasis Christian Centre', 'Share a confidential prayer request with the Oasis prayer team.', true)
on conflict (slug) do nothing;
insert into page_blocks (page_id, block_key, sort_order, visible, content)
select id, 'hero', 0, true, '{"eyebrow":"We’re Standing With You","title":"Prayer Request","intro":"Share your request with our prayer team. Contact information is optional."}'::jsonb
from pages where slug = 'prayer'
on conflict (page_id, block_key) do nothing;

-- ----------------------------------------------------------------------------
-- 4. Form email recipients — editable from Admin → Settings
-- ----------------------------------------------------------------------------
alter table site_settings
  add column if not exists prayer_recipients text default '';
alter table site_settings
  add column if not exists form_recipients text default '';

create table if not exists form_settings (
  id int primary key default 1 check (id = 1),
  prayer_recipients text not null default '',
  form_recipients text not null default '',
  updated_at timestamptz default now()
);
insert into form_settings (id, prayer_recipients, form_recipients)
select 1, coalesce(prayer_recipients, ''), coalesce(form_recipients, '') from site_settings where id = 1
on conflict (id) do update set
  prayer_recipients = case when form_settings.prayer_recipients = '' then excluded.prayer_recipients else form_settings.prayer_recipients end,
  form_recipients = case when form_settings.form_recipients = '' then excluded.form_recipients else form_settings.form_recipients end;
alter table site_settings drop column if exists prayer_recipients;
alter table site_settings drop column if exists form_recipients;
alter table form_settings enable row level security;
drop policy if exists "admin form settings read" on form_settings;
drop policy if exists "admin form settings write" on form_settings;
create policy "admin form settings read" on form_settings for select using (my_role() in ('owner','admin'));
create policy "admin form settings write" on form_settings for all
  using (my_role() in ('owner','admin')) with check (my_role() in ('owner','admin'));

-- Force the authenticated identity onto every client-created audit entry.
create or replace function secure_audit_identity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.actor := auth.uid();
  select coalesce(full_name, 'Staff') into new.actor_name from profiles where id = auth.uid();
  return new;
end $$;
drop trigger if exists secure_audit_identity_before_insert on audit_log;
create trigger secure_audit_identity_before_insert before insert on audit_log
for each row execute function secure_audit_identity();
drop policy if exists "staff insert" on audit_log;
create policy "staff insert" on audit_log for insert with check (my_role() is not null and actor = auth.uid());
--    Public upcoming-events now sort by starts_at, then sort_order. New events
--    added in Admin may have a null sort_order; that's fine, Postgres sorts
--    nulls last for the secondary key. Nothing to run here.
-- ----------------------------------------------------------------------------

-- ============================================================================
--  Verify:
--    select podcast_enabled, twitch_channel from site_settings where id = 1;
-- ============================================================================
