-- ============================================================
-- Migration: Admin-managed leadership sections
-- Date: 2026-08 (part 4)
--
-- Lets admins create / rename / reorder the groupings that leadership is
-- displayed under (e.g. "Senior Leadership", "Pastoral Team", "Ministry
-- Leaders") from the admin panel instead of editing code. Each team member
-- is assigned to a section via the existing team_members.grouping text, which
-- is matched to team_sections.name.
--
-- SAFE TO RE-RUN. Idempotent (CREATE IF NOT EXISTS, ON CONFLICT DO NOTHING,
-- drop-then-create policies).
-- Run in the Supabase SQL Editor.
-- ============================================================

-- Ensure the role helper exists (no-op if base setup already ran).
create or replace function my_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and active $$;

create table if not exists team_sections (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  sort_order int default 0,
  published boolean default true,
  created_at timestamptz default now()
);

-- Seed the sections that were previously hardcoded in the admin dropdown,
-- preserving their original order. Re-running never duplicates.
insert into team_sections (name, sort_order) values
  ('Senior Leadership', 1),
  ('Pastoral Team',     2),
  ('Ministry Leaders',  3),
  ('Staff',             4)
on conflict (name) do nothing;

-- ===== ROW-LEVEL SECURITY =====
alter table team_sections enable row level security;

drop policy if exists "public read"              on team_sections;
drop policy if exists "staff write"              on team_sections;
drop policy if exists "staff read unpub sections" on team_sections;
create policy "public read"               on team_sections for select using (published);
create policy "staff write"               on team_sections for all    using (my_role() in ('owner','admin','editor'));
create policy "staff read unpub sections" on team_sections for select using (my_role() is not null);

-- ============================================================
-- Verify:
--   select name, sort_order, published from team_sections order by sort_order;
-- ============================================================
