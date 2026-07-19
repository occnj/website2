-- ============================================================
-- OASIS CHRISTIAN CENTRE — Supabase setup (run once, SQL Editor)
-- DESTRUCTIVE FRESH INSTALL ONLY. This drops and recreates content tables.
-- For an existing website, run db/migrations-2026-07.sql instead.
-- ============================================================

drop table if exists audit_log, page_blocks, pages, sermons, events, team_members, nav_items, form_settings, give_settings, site_settings, messages, give_links cascade;
drop function if exists my_role() cascade;

-- ===== USER PROFILES / ROLES =====
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'editor' check (role in ('owner','admin','editor','events_only')),
  active boolean not null default true,
  created_at timestamptz default now()
);

create or replace function my_role() returns text
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and active $$;

-- ===== GLOBAL SITE SETTINGS =====
create table site_settings (
  id int primary key default 1 check (id = 1),
  tagline text, address text, phone text, email text, service_time text,
  instagram text, youtube text, facebook text,
  donate_url text default 'https://thekingdomledger.com/donate?code=2335',
  donate_new_tab boolean default true,
  youtube_channel text default '',
  twitch_channel text default '',
  podcast_enabled boolean default false,
  podcast_apple_url text default '',
  podcast_spotify_url text default '',
  calendar_url text default '',
  facebook_page_id text default '',
  live_default_tab text default 'twitch' check (live_default_tab in ('twitch','youtube','facebook'))
);
insert into site_settings (id, tagline, service_time, email)
values (1, 'Know God. Find Hope. Make a Difference.', 'Sundays at 10:00 AM', 'info@oasisnj.net');

create table form_settings (
  id int primary key default 1 check (id = 1),
  prayer_recipients text not null default '',
  form_recipients text not null default '',
  updated_at timestamptz default now()
);
insert into form_settings (id) values (1);

-- ===== NAVIGATION =====
create table nav_items (
  id uuid primary key default gen_random_uuid(),
  label text not null, href text not null,
  sort_order int default 0, visible boolean default true,
  area text default 'main' check (area in ('main','footer'))
);
insert into nav_items (label, href, sort_order) values
 ('About','about.html',1),('Plan Your Visit','plan-your-visit.html',2),
 ('Watch','watch.html',3),('Events','events.html',4),
 ('Leadership','leadership.html',5),('Contact','contact.html',6),
 ('Prayer Request','prayer.html',7);

-- ===== PAGES + CONTENT BLOCKS =====
create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title text not null,
  seo_title text, seo_description text,
  published boolean default true,
  updated_at timestamptz default now()
);
create table page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade,
  block_key text not null, sort_order int default 0,
  visible boolean default true,
  content jsonb not null default '{}',
  unique (page_id, block_key)
);

insert into pages (slug, title) values
 ('index','Home'),('about','About'),('plan-your-visit','Plan Your Visit'),
 ('watch','Watch'),('events','Events'),('leadership','Leadership'),
 ('life-events','Life Events'),('give','Give'),('contact','Contact'),
 ('prayer','Prayer Request');

-- Hero copy seeded from the current site
insert into page_blocks (page_id, block_key, sort_order, content)
select id, 'hero', 0, x.content::jsonb from pages p
join (values
 ('index',       '{"eyebrow":"","title":"You were made to belong here.","intro":"Oasis Christian Centre is a warm, Spirit-led community where everyone is welcome. Come as you are — no matter where you''ve been.","image":""}'),
 ('about',       '{"eyebrow":"Who We Are","title":"About Us","intro":"We are a thriving, multi-ethnic church who loves God and people. Welcome to Oasis Christian Centre."}'),
 ('plan-your-visit','{"eyebrow":"First Time?","title":"Plan Your Visit","intro":"We''ve thought through the details so you don''t have to. Here''s everything you need for a great first Sunday."}'),
 ('watch',       '{"eyebrow":"Messages & Media","title":"Watch","intro":"Every message, every series — available anytime. Watch online or join us live every Sunday at 10 AM."}'),
 ('events',      '{"eyebrow":"What''s Happening","title":"Events","intro":"From Sunday services to community gatherings — there''s always something happening at Oasis."}'),
 ('leadership',  '{"eyebrow":"Our Team","title":"Leadership","intro":"Oasis is led by people who love God, love people, and are committed to serving the Rahway community with integrity and joy."}'),
 ('life-events', '{"eyebrow":"Next Steps","title":"Life Events","intro":"Some moments in life deserve to be marked. We''re honored to stand with you for the ones that matter most."}'),
 ('give',        '{"eyebrow":"External Giving","title":"Continue to our secure giving partner.","intro":"Giving is handled entirely by an external service."}'),
 ('contact',     '{"eyebrow":"We''d Love to Hear From You","title":"Get in Touch","intro":"Whether you have a question, need prayer, or just want to say hello — our team is here and glad to connect."}'),
 ('prayer',      '{"eyebrow":"We’re Standing With You","title":"Prayer Request","intro":"Share your request with our prayer team. Contact information is optional."}')
) as x(slug, content) on p.slug = x.slug;

-- ===== LEADERSHIP TEAM (starts EMPTY — old members removed) =====
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text not null,
  grouping text default 'Ministry Leaders',
  bio text,
  photo_url text,
  links jsonb default '{}',        -- {"instagram":"","facebook":"","email":""}
  sort_order int default 0,
  published boolean default true
);

-- ===== EVENTS =====
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at date not null,
  time_label text,
  location text,
  category text default 'community',
  image_url text,
  registration_url text,
  featured boolean default false,
  published boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ===== SERMONS (YouTube-synced + manual) =====
create table sermons (
  id uuid primary key default gen_random_uuid(),
  youtube_id text unique not null,   -- YouTube video ID (11 chars)
  title text not null,
  description text,
  published_at timestamptz default now(),
  thumbnail_url text,
  series text, speaker text,
  featured boolean default false,
  hidden boolean default false,
  manual boolean default true        -- false when added by the sync function
);

-- ===== AUDIT LOG =====
create table audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  actor uuid references auth.users(id) on delete set null,
  actor_name text,
  action text not null,              -- e.g. 'event.create', 'user.suspend'
  detail text
);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table site_settings enable row level security;
alter table form_settings enable row level security;
alter table nav_items enable row level security;
alter table pages enable row level security;
alter table page_blocks enable row level security;
alter table team_members enable row level security;
alter table events enable row level security;
alter table sermons enable row level security;
alter table audit_log enable row level security;

-- Public site reads
create policy "public read" on site_settings for select using (true);
create policy "public read" on nav_items for select using (visible);
create policy "public read" on pages for select using (published);
create policy "public read" on page_blocks for select using (visible);
create policy "public read" on team_members for select using (published);
create policy "public read" on events for select using (published);
create policy "public read" on sermons for select using (not hidden);

-- Staff writes (owner/admin/editor)
create policy "staff write" on site_settings for all using (my_role() in ('owner','admin','editor'));
create policy "admin form settings read" on form_settings for select using (my_role() in ('owner','admin'));
create policy "admin form settings write" on form_settings for all
  using (my_role() in ('owner','admin')) with check (my_role() in ('owner','admin'));
create policy "staff write" on nav_items for all using (my_role() in ('owner','admin','editor'));
create policy "staff write" on pages for all using (my_role() in ('owner','admin','editor'));
create policy "staff write" on page_blocks for all using (my_role() in ('owner','admin','editor'));
create policy "staff write" on team_members for all using (my_role() in ('owner','admin','editor'));
create policy "staff write" on sermons for all using (my_role() in ('owner','admin','editor'));
create policy "staff read hidden" on sermons for select using (my_role() in ('owner','admin','editor'));
create policy "staff read unpub" on events for select using (my_role() is not null);
create policy "events write" on events for all using (my_role() in ('owner','admin','editor','events_only'));

-- Profiles: read own; owner/admin manage; owner rows protected
create policy "read own" on profiles for select using (id = auth.uid());
create policy "admin read" on profiles for select using (my_role() in ('owner','admin'));
create policy "admin insert" on profiles for insert with check (my_role() in ('owner','admin'));
create policy "admin update" on profiles for update
  using (my_role() in ('owner','admin') and (role <> 'owner' or my_role() = 'owner'));
create policy "admin delete" on profiles for delete
  using (my_role() in ('owner','admin') and role <> 'owner');

-- Audit log: staff can write, owner/admin can read; nobody can edit/delete
create or replace function secure_audit_identity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.actor := auth.uid();
  select coalesce(full_name, 'Staff') into new.actor_name from profiles where id = auth.uid();
  return new;
end $$;
create trigger secure_audit_identity_before_insert before insert on audit_log
for each row execute function secure_audit_identity();
create policy "staff insert" on audit_log for insert with check (my_role() is not null and actor = auth.uid());
create policy "admin read" on audit_log for select using (my_role() in ('owner','admin'));

-- ============================================================
-- STORAGE — public 'media' bucket
-- ============================================================
insert into storage.buckets (id, name, public) values ('media','media', true)
on conflict (id) do nothing;

create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "staff upload media" on storage.objects for insert
  with check (bucket_id = 'media' and my_role() in ('owner','admin','editor'));
create policy "staff update media" on storage.objects for update
  using (bucket_id = 'media' and my_role() in ('owner','admin','editor'));
create policy "staff delete media" on storage.objects for delete
  using (bucket_id = 'media' and my_role() in ('owner','admin','editor'));

-- ============================================================
-- AFTER RUNNING THIS FILE:
-- 1. Authentication → Users → Add user → admin@oasisnj.net (set a NEW password, Auto Confirm ON)
-- 2. Then run (replace the id from the Users list):
--    insert into profiles (id, full_name, role) values ('<USER-ID>', 'Oasis', 'owner');
-- 3. Authentication → Providers → Email → disable "Allow new users to sign up"
-- ============================================================
