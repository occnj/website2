-- ============================================================
-- Migration: October 2026 redesign
--   * Repeating events (events.recurrence + events.exceptions)
--   * Livestream hero switch + schedule, Sunday service times (site_settings)
--   * Serve page: open volunteer positions (volunteer_positions)
--   * Mission blog uses the existing "missions" ministry (made sure it exists)
--
-- SAFE TO RE-RUN. Run AFTER db/migrations-2026-10-change-approval.sql if you
-- use change approval (new tables then join history + approval too).
-- Works on Supabase and on PIBASE.
-- ============================================================

-- ---------- repeating events ----------
-- recurrence: {"freq":"weekly","interval":2,"weekdays":[4]} etc. (see lib/recurrence.js)
alter table events add column if not exists recurrence jsonb default null;
alter table events add column if not exists exceptions date[] not null default '{}';

-- ---------- livestream + service times ----------
-- live_mode: 'auto' follows the schedule, 'live' forces the livestream hero on
-- for everyone, 'off' never shows it.
alter table site_settings add column if not exists live_mode text not null default 'auto';
alter table site_settings add column if not exists live_day int not null default 0;          -- 0 = Sunday
alter table site_settings add column if not exists live_start text not null default '09:55';  -- HH:MM, America/New_York
alter table site_settings add column if not exists live_end text not null default '11:20';
alter table site_settings add column if not exists service_times jsonb not null default
  '[{"time":"8:30 AM","kids":false},{"time":"10:00 AM","kids":true},{"time":"11:30 AM","kids":true}]'::jsonb;
do $$ begin
  alter table site_settings add constraint site_settings_live_mode_check check (live_mode in ('auto','live','off'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table site_settings add constraint site_settings_live_day_check check (live_day between 0 and 6);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table site_settings add constraint site_settings_live_times_check
    check (live_start ~ '^\d{2}:\d{2}$' and live_end ~ '^\d{2}:\d{2}$');
exception when duplicate_object then null; end $$;

-- ---------- serve: open volunteer positions ----------
create table if not exists volunteer_positions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  team text default '',
  description text default '',
  commitment text default '',
  apply_url text not null default 'https://oasisnj.churchcenter.com/people/forms/339396',
  apply_label text not null default 'How to Apply',
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz default now()
);
alter table volunteer_positions enable row level security;
drop policy if exists "public read" on volunteer_positions;
create policy "public read" on volunteer_positions for select using (published);
drop policy if exists "staff read unpub" on volunteer_positions;
create policy "staff read unpub" on volunteer_positions for select using (my_role() is not null);
drop policy if exists "staff write" on volunteer_positions;
create policy "staff write" on volunteer_positions for all
  using (my_role() in ('owner','admin','editor')) with check (my_role() in ('owner','admin','editor'));
grant select on volunteer_positions to anon, authenticated;
grant insert, update, delete on volunteer_positions to authenticated;

-- ---------- mission blog ----------
insert into ministries (name, slug, description, color, sort_order)
values ('Missions', 'missions',
  'Oasis is a sending church. We actively support global mission partners and mobilize our congregation to make a difference both locally and around the world.',
  'var(--charcoal)', 99)
on conflict (slug) do nothing;

-- ---------- serve page in the navigation ----------
insert into nav_items (label, href, sort_order, visible)
select 'Serve', '/serve', coalesce((select sort_order from nav_items where area = 'main' and label = 'Ministries' limit 1), 2) + 1, true
where not exists (select 1 from nav_items where href in ('/serve', 'serve', 'serve.html'));

-- ---------- history + approval for the new table ----------
-- Only when db/migrations-2026-10-change-approval.sql has been run.
do $$
declare
  t text := 'volunteer_positions';
begin
  if to_regprocedure('public.record_content_revision()') is null then return; end if;
  execute $f$
    create or replace function content_revision_tables() returns text[]
    language sql immutable as $b$
      select array[
        'page_overrides',
        'pages', 'page_blocks',
        'site_settings', 'form_settings', 'nav_items',
        'events', 'sermons', 'team_members', 'team_sections',
        'ministries', 'ministry_posts',
        'about_hub_cards', 'beliefs', 'core_values', 'faqs',
        'volunteer_positions',
        'profiles'
      ]
    $b$
  $f$;
  execute format('drop trigger if exists zz_record_revision on public.%I', t);
  execute format('create trigger zz_record_revision after insert or update or delete on public.%I
                    for each row execute function record_content_revision()', t);
  execute format('drop trigger if exists aa_gate_change on public.%I', t);
  execute format('create trigger aa_gate_change before insert or update or delete on public.%I
                    for each row execute function gate_content_change()', t);
end $$;
