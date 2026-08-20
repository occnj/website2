-- ============================================================
-- Migration: Add slug to ministry_posts for clean blog URLs
-- Date: 2026-08 (part 2)
--
-- SAFE TO RE-RUN. All operations are idempotent.
-- Run this in the Supabase SQL Editor AFTER migrations-2026-08-ministries.sql
-- ============================================================

-- Add slug column if it doesn't exist yet
alter table ministry_posts
  add column if not exists slug text;

-- Back-fill existing posts: generate a slug from the title + a short id suffix
-- to guarantee uniqueness even if two posts share the same title.
update ministry_posts
set slug = regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')
           || '-' || substring(id::text, 1, 6)
where slug is null or slug = '';

-- Add a unique constraint per ministry (two ministries can both have a post
-- titled "Summer Recap" — the slugs just need to be unique within one ministry)
alter table ministry_posts
  drop constraint if exists ministry_posts_ministry_slug_unique;
alter table ministry_posts
  add constraint ministry_posts_ministry_slug_unique
  unique (ministry_id, slug);

-- ============================================================
-- Verify:
--   select id, title, slug from ministry_posts order by created_at;
-- ============================================================
