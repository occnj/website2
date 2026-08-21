-- ============================================================
-- Migration: Add overlay_color to ministries
-- Date: 2026-08
--
-- Stores the admin-chosen overlay color for each ministry card and page hero.
-- Defaults to the existing charcoal/blue blend so existing ministries are
-- unchanged until an admin picks a custom color.
-- ============================================================

alter table ministries
  add column if not exists overlay_color text default null;

-- Verify:
-- select name, overlay_color from ministries;
