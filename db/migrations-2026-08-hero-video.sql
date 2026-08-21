-- ============================================================
-- Migration: Add video field to the homepage hero block
-- Date: 2026-08
--
-- Adds a "video" key to the index page hero content JSON so the admin can
-- upload an MP4 (or WebM) that loops silently behind the hero overlay.
-- The image field stays as a poster/fallback for browsers that won't autoplay.
--
-- SAFE TO RE-RUN. Uses jsonb_set only when the key is missing.
-- ============================================================

update page_blocks
set content = jsonb_set(content, '{video}', '""'::jsonb)
where block_key = 'hero'
  and page_id = (select id from pages where slug = 'index')
  and not (content ? 'video');

-- Verify:
-- select content from page_blocks pb
-- join pages p on p.id = pb.page_id
-- where p.slug = 'index' and pb.block_key = 'hero';
