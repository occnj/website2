# Oasis Christian Centre — Supabase Backend Guide

Replaces the earlier Kirby plan. The site stays your custom HTML/CSS design; all content
(text, images, links, events, sermons, team, nav) is loaded from **Supabase** and edited
through the admin panel (`admin.html` is the design spec for it).

---

## Architecture

```
Visitor  ──►  Website (your HTML/CSS/JS on a DigitalOcean droplet, Nginx)
                 │  reads content via supabase-js (anon key, read-only)
                 ▼
              SUPABASE
              ├─ Postgres DB      ← all content
              ├─ Storage          ← images (hero photos, team photos, media library)
              ├─ Auth             ← 6 team logins, roles
              └─ Edge Functions   ← contact-form email, YouTube sync

Editor   ──►  Admin panel (admin.html design, same droplet at /admin)
                 │  writes via supabase-js (authenticated, RLS-protected)
                 ▼
              same Supabase project
```

Hosting: one DigitalOcean droplet (a $6/mo basic droplet is plenty — the site is static
files; all dynamic work happens in Supabase). Supabase free tier covers a church site
easily; Pro is $25/mo if you outgrow it.

---

## Database Schema

**The complete, up-to-date SQL lives in `supabase-setup.sql` — run that file in the Supabase SQL Editor.** The snippets below are reference only.

```sql
-- ===== PAGES: every editable text/image on the site =====
create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 'home', 'give', 'plan-your-visit', ...
  title text not null,
  seo_title text,
  seo_description text,
  published boolean default true,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- Flexible content blocks per page (hero, sections, toggles, order)
create table page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade,
  block_key text not null,            -- 'hero', 'service_info', 'visit_teaser', ...
  sort_order int default 0,
  visible boolean default true,
  content jsonb not null default '{}',
  -- e.g. {"headline":"A place to belong.","subline":"...","cta_label":"Plan Your Visit",
  --       "cta_href":"/plan-your-visit","image":"storage-path/hero-spring.jpg"}
  unique (page_id, block_key)
);

-- ===== SERMONS (synced from YouTube) =====
create table sermons (
  id uuid primary key default gen_random_uuid(),
  youtube_id text unique not null,
  title text not null,                -- from YouTube
  published_at timestamptz,           -- from YouTube
  thumbnail_url text,                 -- from YouTube
  series text,                        -- editor-added
  speaker text,                       -- editor-added
  featured boolean default false,
  hidden boolean default false        -- hide a video without deleting
);

-- ===== EVENTS =====
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  time_label text,                    -- '10:00 AM'
  location text,
  category text check (category in ('worship','women','youth','community','family')),
  description text,
  featured boolean default false,
  image_path text,
  created_by uuid references auth.users(id)
);

-- ===== LEADERSHIP TEAM =====
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  grouping text default 'Ministry team',
  bio text,
  photo_path text,
  sort_order int default 0
);

-- ===== NAVIGATION & FOOTER =====
create table nav_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  sort_order int default 0,
  visible boolean default true,
  area text default 'main' check (area in ('main','footer'))
);

create table site_settings (          -- single-row global settings
  id int primary key default 1 check (id = 1),
  tagline text, address text, phone text, email text,
  service_time text,
  instagram text, youtube text, facebook text,
  -- added July 2026 (see db/migrations-2026-07.sql):
  podcast_enabled boolean default false,   -- show podcast section on /watch
  twitch_channel text default '',          -- live player: Twitch handle
  youtube_channel text default '',         -- live player: YouTube channel/video ID
  facebook_page_id text default '',        -- live player: Facebook page username/ID
  live_default_tab text default 'twitch'   -- which live tab loads first
);

-- ===== GIVING =====
-- Single donation link (The Kingdom Ledger). Editable in Admin -> Giving.
create table give_settings (
  id int primary key default 1 check (id = 1),
  donate_url text not null default 'https://thekingdomledger.com/donate?code=2335',
  new_tab boolean default true
);
insert into give_settings (id) values (1);

-- ===== USER ROLES =====
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'editor' check (role in ('admin','editor','events_only'))
);
```

## Row-Level Security

```sql
alter table pages enable row level security;
alter table page_blocks enable row level security;
alter table sermons enable row level security;
alter table events enable row level security;
alter table team_members enable row level security;
alter table nav_items enable row level security;
alter table site_settings enable row level security;
alter table give_links enable row level security;
alter table messages enable row level security;
alter table profiles enable row level security;

-- Public site: read-only access to published content
create policy "public read" on pages for select using (published);
create policy "public read" on page_blocks for select using (visible);
create policy "public read" on sermons for select using (not hidden);
create policy "public read" on events for select using (true);
create policy "public read" on team_members for select using (true);
create policy "public read" on nav_items for select using (visible);
create policy "public read" on site_settings for select using (true);
create policy "public read" on give_settings for select using (true);

-- Visitors can submit the contact form (insert only, never read)
create policy "public insert" on messages for insert with check (true);

-- Helper: current user's role
create function my_role() returns text language sql stable as
  $$ select role from profiles where id = auth.uid() $$;

-- Editors & admins can write content
create policy "staff write" on pages for all
  using (my_role() in ('admin','editor'));
create policy "staff write" on page_blocks for all
  using (my_role() in ('admin','editor'));
create policy "staff write" on sermons for all
  using (my_role() in ('admin','editor'));
create policy "staff write" on team_members for all
  using (my_role() in ('admin','editor'));
create policy "staff write" on nav_items for all
  using (my_role() in ('admin','editor'));
create policy "staff write" on site_settings for all
  using (my_role() in ('admin','editor'));

-- Events: everyone with a login (incl. events_only)
create policy "staff write" on events for all
  using (my_role() in ('admin','editor','events_only'));

-- Inbox: staff read/update; give links & roles: admin only
create policy "staff read" on messages for select using (my_role() in ('admin','editor'));
create policy "staff update" on messages for update using (my_role() in ('admin','editor'));
create policy "admin only" on give_settings for all using (my_role() = 'admin');
create policy "admin read" on profiles for select using (true);
create policy "admin write" on profiles for update using (my_role() = 'admin');
```

## Storage

Create a public bucket `media`:
- Public read; authenticated write policy for `admin`/`editor` roles.
- Folders: `heroes/`, `team/`, `events/`, `library/`.

---

## How the website reads content

Add supabase-js to each page (or a shared `site-data.js`):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
const sb = supabase.createClient('https://YOUR-PROJECT.supabase.co', 'YOUR_ANON_KEY');

async function loadHome() {
  const { data: blocks } = await sb
    .from('page_blocks')
    .select('block_key, content, visible, sort_order, pages!inner(slug)')
    .eq('pages.slug', 'home')
    .order('sort_order');

  const hero = blocks.find(b => b.block_key === 'hero')?.content;
  document.querySelector('.hero h1').textContent = hero.headline;
  document.querySelector('.hero .hero-sub').textContent = hero.subline;
  document.querySelector('.hero-bg img').src =
    sb.storage.from('media').getPublicUrl(hero.image).data.publicUrl;
  // ... same pattern for every block
}
loadHome();
</script>
```

Events, sermons, team, nav, footer all follow the same `select → render` pattern.
Alternative (faster + better SEO): a small build script on the droplet that regenerates
static HTML on publish (triggered by a Supabase webhook hitting a tiny endpoint, or a
cron every few minutes). Start with client-side fetching; upgrade later if needed.

## Contact & prayer forms (implemented — Resend email)

Forms now send **real email via Resend** — there is no admin inbox / `messages`
table in use. Route: `app/api/contact/route.js`.

- **Prayer requests** → addresses in private `form_settings.prayer_recipients` (editable by Owner/Admin in Admin → Settings)
- **All other forms** → addresses in private `form_settings.form_recipients` (editable by Owner/Admin in Admin → Settings)
- From: `noreply@hub.oasisnj.net`; submitter email set as reply-to.
- Config via env on the server (`.env.local`, gitignored):
  `RESEND_API_KEY`, `RESEND_FROM`, and `SUPABASE_SERVICE_ROLE_KEY`. There is no
  hardcoded secret or recipient fallback.
- Honeypot, validation, field limits, and per-IP rate limiting reduce abuse.

The `messages` table can still be added back later if a stored inbox is ever wanted.

## YouTube sermon sync

Scheduled Edge Function (cron, e.g. hourly):
1. Fetch the channel's uploads via YouTube Data API v3 (`playlistItems.list`).
2. Upsert into `sermons` by `youtube_id` — title/thumbnail/date refresh; `series`,
   `speaker`, `featured` are preserved (editor-owned columns).

```sql
select cron.schedule('youtube-sync', '0 * * * *',
  $$ select net.http_post(url := 'https://YOUR-PROJECT.functions.supabase.co/youtube-sync') $$);
```

## Auth — global administrator + the 6 team members

**Global administrator ("Oasis"):**
1. Supabase Dashboard → Authentication → Users → **Add user** → email `admin@oasisnj.net` → set the password **in the dashboard** (never in code or files).
2. `insert into profiles (id, full_name, role) values ('<that user's id>', 'Oasis', 'admin');`
3. The admin login form accepts the username **Oasis** and maps it to this account (see `admin/config.js`). Since the intended password was shared in chat, set a fresh one in the dashboard.

**Team members:**
1. Authentication → Users → **Invite user** (each email).
2. Insert their row in `profiles` with the right role.
3. Disable public signups (Auth → Providers → Email → turn off signup).

**Connect the admin panel:** copy Project URL + anon key from Settings → API into `admin/config.js`. The anon key is public-safe; RLS enforces permissions.

---

## Deployment checklist

- [ ] Create Supabase project → run schema + RLS SQL above
- [ ] Create `media` bucket + upload current photos/logo
- [ ] Seed `pages`/`page_blocks` with the current site copy
- [ ] Provision droplet + Nginx + SSL (see Droplet Setup below) → point oasisnj.net DNS
- [ ] Wire pages to Supabase reads (`site-data.js`)
- [ ] Build admin panel from `admin.html` design (same supabase-js, authenticated)
- [ ] Edge Function: YouTube sync + cron
- [ ] Verify donation link (The Kingdom Ledger) in `give_settings`
- [ ] Invite 6 users, set roles, disable public signup

---

## DigitalOcean Droplet Setup

One-time setup (developer, ~30 min). Ubuntu 24.04 basic droplet ($6/mo).

```bash
# 1. Basics + firewall
adduser deploy && usermod -aG sudo deploy        # don't run as root
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
apt update && apt install -y nginx certbot python3-certbot-nginx

# 2. Site files
mkdir -p /var/www/oasis
# upload the project files (rsync/git) into /var/www/oasis
# admin panel lives at /var/www/oasis/admin.html + /var/www/oasis/admin/
```

```nginx
# /etc/nginx/sites-available/oasis
server {
  server_name oasisnj.net www.oasisnj.net;
  root /var/www/oasis;
  index index.html;

  # clean URLs: /about -> about.html
  location / { try_files $uri $uri.html $uri/ =404; }

  # admin at /admin
  location = /admin { return 301 /admin.html; }

  gzip on;
  gzip_types text/css application/javascript image/svg+xml;
  location ~* \.(jpg|jpeg|png|webp|svg|css|js)$ { expires 7d; add_header Cache-Control "public"; }
}
```

```bash
ln -s /etc/nginx/sites-available/oasis /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 3. DNS: A records for oasisnj.net + www -> droplet IP, then HTTPS:
certbot --nginx -d oasisnj.net -d www.oasisnj.net   # auto-renews
```

### Deploying updates
```bash
rsync -avz --delete ./ deploy@oasisnj.net:/var/www/oasis/
```
(Content changes never need a deploy — they come from Supabase. Deploys are only for
design/code changes.)

### Droplet maintenance
- Enable DigitalOcean automated backups ($1.20/mo) on the droplet
- `apt upgrade` monthly; certbot renews SSL automatically
- Supabase keys: only the **anon** key ever ships in site files — never the service_role key
