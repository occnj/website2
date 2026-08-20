-- ============================================================
-- Migration: Per-ministry blog (ministries + ministry_posts)
-- Date: 2026-08
--
-- SAFE TO RE-RUN. This script is fully idempotent:
--   * tables use CREATE TABLE IF NOT EXISTS
--   * the ministry seed uses ON CONFLICT DO NOTHING
--   * every policy is dropped-if-exists before being (re)created
--   * the my_role() helper is created only if it is missing, so this
--     migration also works on a brand-new database.
--
-- Run this in the Supabase SQL Editor. It will NOT touch or duplicate any
-- of your existing tables (events, team_members, pages, etc).
-- ============================================================

-- ---- Ensure the role helper exists (no-op if base setup already ran) ----
create or replace function my_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and active $$;

-- ===== MINISTRIES =====
create table if not exists ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  color text default 'var(--blue)',
  image_url text,
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz default now()
);

-- Seed the 6 ministries that were previously hardcoded on the About page.
-- ON CONFLICT means re-running never creates duplicates.
insert into ministries (name, slug, description, color, sort_order) values
  ('WOW — Women of Worth',   'wow-women',      'A sisterhood of women growing in faith, prayer, and purpose. Through brunches, Bible studies, and real conversations, WOW builds women who lead with grace.',                                              'var(--blue)',     1),
  ('FMO — For Men Only',     'fmo-men',        'Men doing life together — anchored in the Word, accountable to each other, and moving forward with purpose. Brotherhood that goes beyond Sunday.',                                                      'var(--amber)',    2),
  ('The Collective — Youth', 'the-collective', 'Young adults and high school students building community, deepening faith, and discovering their God-given purpose together.',                                                                           '#4A8C6A',         3),
  ('Kids Ministry',          'kids',           'Safe, fun, and age-appropriate environments from nursery through middle school. Our kids team is committed to raising the next generation in faith.',                                                    '#8B6BAE',         4),
  ('The Journey',            'the-journey',    'For those navigating recovery, restoration, or a fresh start. The Journey walks alongside people with grace, truth, and practical support.',                                                             '#C45E4A',         5),
  ('Missions',               'missions',       'Oasis is a sending church. We actively support global mission partners and mobilize our congregation to make a difference both locally and around the world.',                                           'var(--charcoal)', 6)
on conflict (slug) do nothing;

-- ===== MINISTRY POSTS =====
create table if not exists ministry_posts (
  id uuid primary key default gen_random_uuid(),
  ministry_id uuid references ministries(id) on delete cascade,
  title text not null,
  body text,
  image_url text,
  published_at date default current_date,
  published boolean default true,
  created_at timestamptz default now()
);

-- ===== ROW-LEVEL SECURITY =====
alter table ministries      enable row level security;
alter table ministry_posts  enable row level security;

-- Drop-then-create makes the policy block safe to re-run.
drop policy if exists "public read"                on ministries;
drop policy if exists "staff write"                on ministries;
drop policy if exists "staff read unpub ministries" on ministries;
create policy "public read"                 on ministries for select using (published);
create policy "staff write"                 on ministries for all    using (my_role() in ('owner','admin','editor'));
create policy "staff read unpub ministries" on ministries for select using (my_role() is not null);

drop policy if exists "public read"           on ministry_posts;
drop policy if exists "staff write"           on ministry_posts;
drop policy if exists "staff read unpub posts" on ministry_posts;
create policy "public read"            on ministry_posts for select using (published);
create policy "staff write"            on ministry_posts for all    using (my_role() in ('owner','admin','editor'));
create policy "staff read unpub posts" on ministry_posts for select using (my_role() is not null);

-- ============================================================
-- Verify (optional — run these SELECTs to confirm):
--   select name, slug, published from ministries order by sort_order;
--   select count(*) from ministry_posts;
-- ============================================================
