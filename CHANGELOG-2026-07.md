# Oasis Website — Change Log & Handoff (July 2026)

Master reference for future work. Covers everything changed after the Next.js
migration (`19efecc`): what was done, the SQL to run, env vars needed, and where
key logic lives. For plain deploy/restart commands see `SERVER-COMMANDS.md`.

## Latest UI fixes — July 18, 2026

- Admin now hides the public site header and footer so the content manager has
  a dedicated workspace.
- Prayer messaging consistently uses **“We’re Standing With You.”**
- Visual Edit now detects direct visible text inside mixed layout containers,
  so text is editable across all site pages instead of only selected elements.
- Admin Settings now controls the recipient addresses for prayer requests and
  regular contact forms; addresses are comma-, space-, or line-separated.
- Admin security now includes a five-minute inactivity sign-out, manual sign-out
  in both the top bar and account sidebar, no-store/no-index admin headers, and
  baseline browser security headers. The committed Resend-key fallback was removed.

---

## Quick deploy (server)

Run one at a time:

```bash
cd ~/website2
git pull origin main
rm -rf .next
npm run build
fuser -k 5900/tcp
setsid npm run start > ~/website2/app.log 2>&1 < /dev/null &
sleep 8 && tail -5 ~/website2/app.log
```

App: `next start` on port **5900**, `basePath: /website`. Never run `next dev`
in production (serves CSS differently — was the cause of the "no CSS" issue).
Always `rm -rf .next` before rebuilding after CSS/layout changes.

---

## SQL to run once (Supabase SQL editor)

All idempotent. Full file: `db/migrations-2026-07.sql`.

```sql
-- Podcast section toggle (Watch page, hidden until true)
alter table site_settings add column if not exists podcast_enabled boolean default false;

-- Live player: tabbed Twitch / YouTube / Facebook
alter table site_settings add column if not exists twitch_channel   text default '';
alter table site_settings add column if not exists youtube_channel  text default '';
alter table site_settings add column if not exists facebook_page_id text default '';
alter table site_settings add column if not exists live_default_tab text default 'twitch';
```

Verify:
```sql
select podcast_enabled, twitch_channel, youtube_channel, facebook_page_id, live_default_tab
from site_settings where id = 1;
```

Fresh installs from `supabase-setup.sql` already include these columns.

---

## Environment variables (server `.env.local`)

`.env.local` is gitignored — lives only on the server. Create/append:

```bash
echo 'RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx' >> ~/website2/.env.local
echo 'RESEND_FROM=Oasis Website <noreply@hub.oasisnj.net>' >> ~/website2/.env.local
```

Takes effect only on a fresh `npm run start`. The email route falls back to a
hardcoded key if env is missing, but env is preferred (keeps the key out of the
public GitHub repo).

---

## Forms & email (Resend)

- API route: `app/api/contact/route.js`. Sends via the Resend REST API (no npm
  dependency — plain `fetch`).
- **Routing:**
  - Prayer requests (`formType: 'prayer'` or reason "Prayer Request")
    → **oasis@oasisnj.net, PHegel@oasisnj.net, pjhegel@verizon.net**
  - Everything else → **oasis@oasisnj.net**
- From: `noreply@hub.oasisnj.net`; submitter's email set as reply-to.
- Honeypot field (`company`) silently drops bots.
- Forms: `components/ContactForm.js` (contact page), `components/PrayerForm.js`
  (used on `/prayer` and embedded in the home Care & Prayer section).
- **Both forms were previously fake** (fake 1.2s "Sent!" with no email) — now
  they actually deliver.

---

## What changed, by commit (newest first)

### `59cd0d5` — Forms + scroll flicker
- Real Resend email delivery; prayer routing to pastoral team, all else to oasis@.
- New `/prayer` page + `PrayerForm`. Renamed Next Steps "Prayer" → "Prayer Request";
  home CTA, footer, and Next Steps now link `/prayer`.
- Home Care & Prayer section and Contact form now use the real working form.
- **Scroll flicker fix (site-wide):** `Header` scroll handler rAF-throttled and
  only updates state on change; fixed header promoted to its own GPU layer
  (`transform: translateZ(0)`) so `backdrop-filter: blur()` stops re-rasterizing
  the page on every scroll frame.

### `de784da` — Tabbed live player
- `components/LivePlayer.js`: tabs for **Twitch / YouTube Live / Facebook Live**
  (Restream pushes to all simultaneously). Visitors switch freely.
- Admin controls default tab + each platform's channel/page ID
  (Navigation & Footer → Live player panel).

### `e1b6d5b` — Service window corrected
- Live window is **Sunday 9:55 AM – 11:20 AM ET** (`lib/serviceWindow.js`).

### `9b826c5` / `ee132f4` — Smart Watch info panel
- `components/LiveInfoPanel.js`: badge, heading, copy, and button all switch to
  live mode during the service window ("We're Live!" / "▶ Watch Live Now").

### `48eac0c` — Sermon title clamp
- YouTube titles clamped to 2 lines so long titles don't blow out card height.

### `dd70964` — Watch / Home / Admin fixes
- Twitch embed contained (was overflowing into the info panel).
- Podcast section admin-toggleable, hidden by default (`podcast_enabled`).
- About subnav scroll flicker fixed (rAF + functional update).
- Nav reorder respects `area='main'` filter.
- Removed redundant Home sections: Upcoming Events, Circles, Giving.

### `2ee4208` — Smart live banner
- `components/LiveBanner.js`: red "Live Now" only during the service window,
  neutral strip otherwise. Re-checks each minute.

### `60c0763` — Watch Now Live (Twitch)
- Replaced "Latest Message" YouTube block with the live Twitch player.
- `components/TwitchEmbed.js` client component (Twitch needs a `parent=` param
  matching the runtime hostname).

### `0738cd7` — Structure & logic fixes
- Visual Edit now covers all text (generic detection replaced the selector
  whitelist in `public/cms-core.js`; every `<a href>` link-editable).
- Footer rebuilt on flexbox + real SVG social icons.
- Plan Your Visit: removed gold address bar; "Have a Question?" → "Get Directions →".
- About / Our Beliefs: text left, image right.
- Watch pulls from the YouTube channel RSS feed (`lib/youtube.js`, no API key).
- Hardcoded events removed; Home + Events render only admin-managed events.
- Next Steps dropdown no longer vanishes crossing the hover gap.

---

## Live streaming (Restream)

Restream is the distributor — it pushes one OBS/software feed out to Twitch,
YouTube, and Facebook simultaneously. The website does **not** self-host video;
it just embeds whichever platform tab the visitor picks. No RTMP ingest on the
server. To change platforms/handles, use Admin → Navigation & Footer → Live player.

Service window (auto live/offline switching): edit the two numbers in
`lib/serviceWindow.js`. Currently Sun 9:55–11:20 AM ET.

---

## Open items / things to know

- **Rotate the Resend key.** It was committed as a fallback in an earlier version;
  since the repo is public, generate a fresh key in Resend and put it only in
  `.env.local`.
- **Contact details.** Public pages now use one Admin-controlled address, phone,
  email, and service time, and hide values until configured.
- **YouTube feed limit.** RSS exposes only ~15 recent videos. Full back-catalog
  needs a YouTube Data API key — not wired.
- **Podcast links.** Apple/Spotify URLs are controlled in Admin and their buttons
  stay hidden until configured.

## July 18 full-site remediation

- Upgraded to Next.js 15.5.18 / React 19.1 and pinned patched PostCSS; npm audit: 0.
- Added working life-event forms, prayer-with-optional-contact handling, message
  search, configurable calendar/podcast links, and social icons in desktop/mobile nav.
- Simplified giving to one validated external HTTPS provider; no payment or giving
  processing remains on the website.
- Moved form recipients to private, Admin-only `form_settings`; server API reads
  them with `SUPABASE_SERVICE_ROLE_KEY`. Removed hardcoded recipient fallbacks.
- Added form rate limits/field bounds, safe URL handling, Visual Edit sanitization,
  CSP/HSTS headers, authoritative audit identity, password recovery, and 5-minute
  inactivity sign-out.
- Added Prayer to Admin Pages/Visual Edit, safe idempotent migration SQL, destructive
  warnings on fresh-install SQL, branded 404/icon, robots, sitemap, metadata, and ESLint.
- Removed fake contact values and dead links; pages now use shared Admin settings.

---

## Key files map

| Area | File(s) |
|---|---|
| Live tabbed player | `components/LivePlayer.js` |
| Live/offline banner | `components/LiveBanner.js` |
| Live info panel | `components/LiveInfoPanel.js` |
| Service window logic | `lib/serviceWindow.js` |
| YouTube feed | `lib/youtube.js` |
| Contact form | `components/ContactForm.js` |
| Prayer form + page | `components/PrayerForm.js`, `app/prayer/page.js` |
| Email API route | `app/api/contact/route.js` |
| About sticky subnav | `components/AboutSubnav.js` |
| Header (scroll) | `components/Header.js` |
| Visual editor | `public/cms-core.js`, `public/editor.js`, `components/CmsBridge.js` |
| Admin UI | `public/admin/views.js`, `public/admin/actions.js`, `public/admin/db.js` |
| Data access | `lib/data.js` |
| Global styles | `app/globals.css`; per-page `app/*/*.css` |
| DB schema | `supabase-setup.sql`; migrations in `db/` |
