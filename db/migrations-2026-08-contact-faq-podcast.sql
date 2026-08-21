-- ============================================================
-- Migration: Contact info, closure notice, FAQ table, podcast nav
-- Date: 2026-08
-- ============================================================

-- 1. Office hours stored as ordered JSON rows so admin can add/remove/reorder days.
--    Default matches the current hardcoded values.
alter table site_settings
  add column if not exists office_hours jsonb default '[
    {"day":"Tuesday – Thursday","hours":"10 AM – 4 PM"},
    {"day":"Friday","hours":"10 AM – 2 PM"},
    {"day":"Sunday","hours":"9 AM – 12 PM"},
    {"day":"Monday / Saturday","hours":"Closed"}
  ]'::jsonb;

-- 2. Closure / alert notice — shown as a banner on the contact page (and
--    optionally site-wide). Empty string = no banner shown.
alter table site_settings
  add column if not exists closure_notice text default '';

-- 3. Podcast nav URL — shows "Podcast" in the nav after Prayer Request.
--    Leave empty to hide the nav item.
alter table site_settings
  add column if not exists podcast_nav_url text default '';

-- 4. FAQ table — admin-managed questions and answers for Plan Your Visit.
create table if not exists faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  sort_order int  default 0,
  published  boolean default true,
  created_at timestamptz default now()
);

alter table faqs enable row level security;
drop policy if exists "public read faqs"  on faqs;
drop policy if exists "staff write faqs"  on faqs;
create policy "public read faqs"  on faqs for select using (published);
create policy "staff write faqs"  on faqs for all    using (my_role() in ('owner','admin','editor'));

-- Seed the existing hardcoded FAQs so nothing disappears on deploy.
insert into faqs (question, answer, sort_order) values
  ('What should I wear?',
   'Come as you are, seriously. You''ll see everything from jeans to business casual. We care far more about you being here than what you''re wearing.',
   1),
  ('Is there parking?',
   'Yes — free parking is available in our lot directly adjacent to the building. Street parking is also available on nearby roads. Look for our signage to guide you in.',
   2),
  ('How long is the service?',
   'Our Sunday services typically run about 75 minutes. You can expect worship music, announcements, and a message. We try to end on time so you can plan your day.',
   3),
  ('Do I need to give money?',
   'Not at all. Giving is a personal act of worship for our members. As a first-time guest, please don''t feel any pressure — just enjoy the service.',
   4),
  ('Is Oasis welcoming to everyone?',
   'Absolutely. No matter your background, story, or season of life — you are welcome at Oasis. We believe every person matters and everyone belongs.',
   5),
  ('What if I have more questions?',
   'We''d love to hear from you. Reach out via our contact page or just show up Sunday and ask one of our welcome team members in person — they''re the ones with the big smiles.',
   6)
on conflict do nothing;

-- ============================================================
-- Verify:
--   select closure_notice, office_hours, podcast_nav_url from site_settings where id = 1;
--   select question, sort_order from faqs order by sort_order;
-- ============================================================
