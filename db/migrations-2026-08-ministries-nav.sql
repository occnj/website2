-- ============================================================
-- Migration: Add Ministries to main navigation
-- Date: 2026-08
-- SAFE TO RE-RUN (ON CONFLICT DO NOTHING)
-- ============================================================

insert into nav_items (label, href, sort_order, visible)
values ('Ministries', '/ministries', 2, true)
on conflict do nothing;

-- Shift existing items down to make room after About (sort_order 1)
update nav_items set sort_order = sort_order + 1
where label != 'About' and label != 'Ministries' and sort_order >= 2;

-- ============================================================
-- Verify:
--   select label, href, sort_order, visible from nav_items order by sort_order;
-- ============================================================
