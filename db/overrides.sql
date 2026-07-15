-- ============================================================
-- Oasis CMS — Visual editor overrides
-- Run this in the Supabase SQL Editor (after supabase-setup.sql).
-- Adds one flexible per-page store that the inline visual editor
-- writes to and the public site reads from. No per-field schema:
-- every editable element is keyed by its stable DOM path.
-- ============================================================

create table if not exists page_overrides (
  slug        text primary key,
  edits       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now(),
  updated_by  uuid references auth.users(id)
);

alter table page_overrides enable row level security;

-- Anyone can read published overrides (the live website)
drop policy if exists "public read overrides" on page_overrides;
create policy "public read overrides"
  on page_overrides for select using (true);

-- Only signed-in staff can write
drop policy if exists "staff write overrides" on page_overrides;
create policy "staff write overrides"
  on page_overrides for all
  using (my_role() in ('owner','admin','editor'))
  with check (my_role() in ('owner','admin','editor'));

-- Seed empty rows for every existing page (optional; upsert also creates them)
insert into page_overrides (slug)
select slug from pages
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Storage: the editor uploads to the existing public `media`
-- bucket under an `inline/` folder. If you followed
-- SUPABASE-GUIDE.md the bucket + write policy already exist.
-- ------------------------------------------------------------
