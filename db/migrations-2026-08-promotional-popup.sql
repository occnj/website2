-- ============================================================
-- Migration: Site-wide promotional popup
-- Date: 2026-08
-- Safe to run more than once.
-- ============================================================

alter table site_settings
  add column if not exists popup_enabled boolean default false,
  add column if not exists popup_eyebrow text default '',
  add column if not exists popup_title text default '',
  add column if not exists popup_description text default '',
  add column if not exists popup_image_url text default '',
  add column if not exists popup_primary_label text default '',
  add column if not exists popup_primary_url text default '',
  add column if not exists popup_secondary_label text default '',
  add column if not exists popup_secondary_url text default '',
  add column if not exists popup_accent_color text default '#00A4CC',
  add column if not exists popup_delay_seconds integer default 2;

-- Verify:
-- select popup_enabled, popup_title, popup_image_url from site_settings where id = 1;
