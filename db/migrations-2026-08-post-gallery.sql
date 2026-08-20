-- ============================================================
-- Migration: Add photo gallery to ministry_posts
-- Date: 2026-08 (part 3)
--
-- Adds a `gallery` column holding an ordered JSON array of image URLs
-- (up to 20 per post). Portrait and landscape are both supported — the
-- public page lays them out in an orientation-aware grid with a lightbox.
--
-- SAFE TO RE-RUN. Idempotent.
-- Run in the Supabase SQL Editor AFTER migrations-2026-08-ministries.sql
-- ============================================================

alter table ministry_posts
  add column if not exists gallery jsonb default '[]'::jsonb;

-- Back-fill any NULLs to an empty array so the app never has to null-check.
update ministry_posts set gallery = '[]'::jsonb where gallery is null;

-- ============================================================
-- Verify:
--   select id, title, jsonb_array_length(gallery) as photos from ministry_posts;
-- ============================================================
