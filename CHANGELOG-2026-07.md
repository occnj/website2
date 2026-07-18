# Oasis Website — Change Log & Handoff (July 2026)

Reference for future work. Covers everything changed after the Next.js
migration (`19efecc`), the SQL to run, and where key logic lives.

---

## How to deploy an update on the server

```bash
cd ~/website2
git pull origin main
rm -rf .next          # clears stale build (important after CSS changes)
npm run build
pkill -f "next start"; nohup npm run start > ~/website2/app.log 2>&1 &
```

The app runs `next start` on port **5900** behind a proxy, with `basePath: /website`
(see `next.config.js`). Do NOT run `next dev` in production — it serves CSS
differently and was the cause of the "no CSS on the site" issue.

---

## SQL to run (Supabase SQL editor)

Full migration file: `db/migrations-2026-07.sql`. The essentials:

```sql
-- Podcast section toggle for the Watch page (hidden until true)
alter table site_settings add column if not exists podcast_enabled boolean default false;

-- Optional Twitch channel override (defaults to "occnj" in code)
alter table site_settings add column if not exists twitch_channel text default '';
```

Both are idempotent. Fresh installs from `supabase-setup.sql` already include
these columns — the migration is only for the existing production DB.

Verify:
```sql
select podcast_enabled, twitch_channel from site_settings where id = 1;
```

---

## What changed, by commit

### `0738cd7` — Structure & logic fixes
- **Visual Edit now covers all text.** `public/cms-core.js` replaced its
  hardcoded selector whitelist with generic detection: any element whose
  content is plain inline text is editable. Link editing broadened to every
  `<a href>`. (`public/cms-core.js`, `public/editor.js`)
- **Footer rebuilt on flexbox** so the 4 columns stay side-by-side and wrap
  cleanly; fake "fb ig yt" text replaced with real SVG social icons.
  (`components/Footer.js`, `.footer-*` rules in `app/globals.css`)
- **Plan Your Visit:** removed the gold/amber address bar; "Have a Question?"
  button is now "Get Directions →" → Google Maps. (`app/plan-your-visit/page.js`)
- **About / Our Beliefs:** text moved to a left column with an image slot on
  the right. (`app/about/page.js`)
- **Watch pulls from YouTube** via the channel RSS feed (no API key).
  (`lib/youtube.js`)
- **Hardcoded events removed** from Home + Events; both render only
  admin-managed events with an empty state. Admin add/edit/delete confirmed
  working. Public ordering fixed to chronological. (`app/page.js`,
  `app/events/page.js`, `lib/data.js`)
- **Next Steps dropdown** no longer vanishes when the mouse crosses the gap —
  added an invisible hover bridge + close delay + `:focus-within`.
  (`app/globals.css`)

### `60c0763` — Watch Now Live (Twitch)
- Replaced the "Latest Message" YouTube feature block with a **"Watch Now
  Live"** section embedding the Twitch stream (channel **`occnj`**).
- `components/TwitchEmbed.js` is a client component because Twitch requires a
  `parent=` param matching the runtime hostname (works on localhost, staging,
  and oasisnj.net without edits). Channel override via `settings.twitch_channel`.

### `2ee4208` — Smart live banner
- `components/LiveBanner.js` shows the red "Live Now" banner **only during the
  Sunday service window (9:45 AM–12:00 PM America/New_York)**; otherwise a
  neutral "We stream live every Sunday at 10:00 AM EST" strip. Re-checks each
  minute. Service window is two numbers at the top of the file.

### `dd70964` — Watch / Home / Admin fixes
- **Twitch embed containment:** the offline widget was overflowing its grid
  column into the info panel. Video cell now `min-height:340px; overflow:hidden`
  with the iframe pinned `position:absolute; inset:0`. (`app/watch/watch.css`)
- **Podcast section is admin-toggleable, hidden by default.** Gated behind
  `settings.podcast_enabled`; toggle added in Admin → Navigation & Footer →
  Site info. (`app/watch/page.js`, `public/admin/views.js`,
  `public/admin/actions.js`)
- **About scroll flicker fixed.** `components/AboutSubnav.js` scroll handler was
  calling `setActive` every frame with a stale value. Now `requestAnimationFrame`
  throttled + functional update (only re-renders when the active section
  changes). Subnav-link `transition` narrowed from `all` to color-only.
  (`components/AboutSubnav.js`, `app/about/about.css`)
- **Nav reorder respects the menu filter.** `moveRow` in `public/admin/views.js`
  now accepts an `eq` filter so main-nav reordering doesn't clash with footer
  items. Up/down arrows in Admin → Navigation & Footer → Main navigation.
- **Home redundancy removed.** Deleted the Upcoming Events, Circles, and Giving
  sections (duplicated the "Get Involved / Next Steps" row + nav dropdown).
  Care & Prayer and below untouched. The "Circles" link in Get Involved was
  repointed to /contact. (`app/page.js`)

---

## Open items / things to know

- **Placeholder contact info.** Some pages still show a `555` phone and the
  address differs between pages (see `AUDIT.md`). Fix in Admin → Settings once
  you have the real values.
- **YouTube feed limit.** The RSS feed exposes only ~15 recent videos. Full
  back-catalog would need a YouTube Data API key — not wired yet.
- **Twitch column width.** At desktop the live column is `1.4fr`; if the offline
  schedule widget feels cramped, bump it in `app/watch/watch.css`.
- **Podcast links.** When enabled, the Apple Podcasts / Spotify buttons in the
  podcast section are still `href="#"` placeholders — set real URLs before
  turning the section on.

## Key files map

| Area | File(s) |
|---|---|
| Live Twitch player | `components/TwitchEmbed.js` |
| Live/offline banner | `components/LiveBanner.js` |
| YouTube feed | `lib/youtube.js` |
| About sticky subnav | `components/AboutSubnav.js` |
| Visual editor | `public/cms-core.js`, `public/editor.js`, `components/CmsBridge.js` |
| Admin UI | `public/admin/views.js`, `public/admin/actions.js`, `public/admin/db.js` |
| Data access | `lib/data.js` |
| Global styles | `app/globals.css`; per-page `app/*/*.css` |
| DB schema | `supabase-setup.sql`; migrations in `db/` |
