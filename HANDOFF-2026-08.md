# Oasis Website — Session Handoff
**Repo:** `https://github.com/occnj/website2.git`  
**Live test site:** `https://test.oasisnj.net` (served at root `/`, port 5900)  
**Admin:** `https://test.oasisnj.net/admin` (login: Oasis / Supabase auth)  
**Stack:** Next.js 15 · React 19 · Supabase · Node 20 · sharp · isomorphic-dompurify  
**Deploy:** DigitalOcean droplet · `/var/www/website2` · `npm run start -p 5900`

---

## Deploy sequence (always)
```bash
ssh root@<droplet-ip>
cd /var/www/website2
git pull origin main
rm -rf .next
npm install
npm run build
fuser -k 5900/tcp
setsid npm run start > /var/www/website2/app.log 2>&1 < /dev/null &
sleep 8 && tail -5 /var/www/website2/app.log   # expect: ✓ Ready
```
`.env.local` lives on the droplet at `/var/www/website2/.env.local` — never committed. Back it up before any `rm -rf`.

---

## Pending: run these in Supabase SQL editor
Two migrations are on GitHub but NOT yet applied to the live DB:

**1. `db/migrations-2026-08-post-slugs.sql`**  
Adds `slug` column to `ministry_posts`. Until this runs you will see:  
`⚠ Could not find the 'slug' column of 'ministry_posts' in the schema cache`  
Post URLs will still use UUIDs. Run this first.

**2. `db/migrations-2026-08-ministries-nav.sql`**  
Adds "Ministries" to `nav_items` table so it appears in the DB-driven nav.  
The static fallback already shows it — this makes it admin-editable.

---

## What was built this session

### Leadership
- Removed from main nav (still in `REMOVED_NAV_LABELS`)
- Moved into About page sub-nav as in-page anchor `#leadership`
- About page fetches `getTeamMembers()` and renders leadership section inline

### Ministry Blog (fully admin-controlled)
- **DB tables:** `ministries` + `ministry_posts` (FK cascade, RLS set)
- **Seed:** 6 ministries (WOW, FMO, Youth Oasis, Kids, The Journey, Missions)
- **Routes:**
  - `/ministries` — index page listing all ministries
  - `/ministries/[slug]` — ministry landing + post grid
  - `/ministries/[slug]/[postId]` — single post (slug or UUID, backward-compat)
- **Short vanity URLs** (next.config.js redirects):
  `/wow` `/fmo` `/youth` `/kids` `/journey` `/missions`
- **Admin:** Sidebar → Ministries → accordion view per ministry → `+ Post` per row
- **Rich text editor** in post body: Bold, Italic, Underline, H2, H3, P, Lists, Link, HR
  - Uses `contenteditable` + `data-rt-cmd` delegated listener (NOT inline onclick)
  - Toolbar active-state highlighting: **NOT YET BUILT** (issue #1 from last session)
  - H1 button: **NOT YET BUILT** (issue #2 from last session)
- **Gallery lightbox** for event photos in posts: **NOT YET BUILT** (issue #4)
- **Image compression:** `/api/compress-image` (sharp, WebP, 1920×1080 max, q82)
  - Both admin and visual editor compress before Supabase upload
  - Falls back to original if sharp fails

### Fixes applied
- `basePath: '/website'` removed — app serves at root (was breaking admin CSS/JS)
- Favicon: switched to `logo-1776793086472.png` (500×500 square)
- Hero image: covers full frame (was right 52% only)
- Upload progress: spinner overlay in both admin modal and visual editor
- Life Events visual edit: admin now opens `/events?edit=1`
- Audit log: richer cards — name, colour-coded badge, detail, timestamp
- Short ministry URLs: `/wow`, `/fmo`, `/youth`, `/kids`, `/journey`, `/missions`
- Ministries added to main nav + new `/ministries` index page
- `events_only` role gated from Ministries sidebar item
- "Back to Ministry" link uses `params.slug` (URL), not FK join (was breakable)
- Post slug generated from title on create, preserved on edit

### Bugs found & fixed this session
- Rich text `onclick` handlers had `\"` inside HTML attributes (invalid — buttons silent-failed). Rewritten with `data-rt-cmd` + delegated listener.
- `addMinistryPost` passed ministry name via `esc()` which doesn't escape `'` — apostrophe in name would break JS. Added `jsq()` helper.
- `await sanitizeHtml()` was inside JSX (illegal in React server components) — caused `Digest: 2294072958` crash on any ministry post page.
- `sort_order: 99` on every ministry edit reset ordering — fixed, new ministries append to end, edits preserve position.
- Triple `getMinistryBySlug` call on landing page — reduced to one.

---

## Known issues / next session TODO

### High priority
1. **Rich text toolbar active state** — when cursor is inside bold text, the B button is not highlighted. Need `selectionchange` listener calling `document.queryCommandState('bold')` etc. to toggle active class on each button.
2. **H1 button missing** from rich text toolbar (only H2, H3 currently).
3. **Gallery lightbox** — admin should be able to insert a photo gallery into a post body; public post page renders it as a clickable grid with a lightbox overlay.

### Medium priority
4. **Slug migration not yet run** — see Supabase section above.
5. **Ministries nav migration not yet run** — see Supabase section above.
6. **Post slug uniqueness** — if two posts in one ministry have identical titles, slug collision will throw a DB unique constraint error. Should append a short random suffix on conflict.
7. **`editor` role and draft visibility** — `staff read unpub posts` RLS policy checks `my_role() is not null`. If a staff user's profile row doesn't exist or has no role, they can't see their own drafts. Worth verifying.

### Low priority
8. **`/ministries` hero image** — page has no placeholder image yet, falls back to generic hero. Add one via visual edit.
9. **Missions page** — there is both a `missions` ministry blog AND a `#missions` section on the About page. Could be confusing. Consider whether the About section should link to the blog.
10. **`/leadership` standalone page** still exists and is built. It renders the same team as the About `#leadership` section. Consider whether to keep it or redirect to `/about#leadership`.

---

## Key files

| File | Purpose |
|------|---------|
| `components/Header.js` | Nav — `REMOVED_NAV_LABELS`, `STATIC_LINKS` |
| `components/AboutSubnav.js` | About page sub-nav anchors |
| `app/about/page.js` | About page — leadership + ministries from DB |
| `app/ministries/page.js` | Ministries index |
| `app/ministries/[slug]/page.js` | Ministry landing |
| `app/ministries/[slug]/[postId]/page.js` | Single post |
| `app/ministries/ministries.css` | Ministry pages styles |
| `app/api/compress-image/route.js` | Image compression endpoint (sharp) |
| `lib/data.js` | All data fetchers — `getMinistries`, `getMinistryPosts`, `getMinistryPostBySlug` |
| `lib/sanitizeHtml.js` | Server-side HTML sanitizer (isomorphic-dompurify, lazy import) |
| `public/admin/views.js` | Admin UI rendering — includes `richtext` field type + toolbar |
| `public/admin/actions.js` | Admin CRUD — ministry + post handlers, `jsq()` helper |
| `public/admin/db.js` | Admin DB layer — upload with compression |
| `public/editor.js` | Visual editor — upload with compression, spinner |
| `next.config.js` | Redirects (short ministry URLs), security headers |
| `db/migrations-2026-08-ministries.sql` | ✅ Applied — ministries + ministry_posts tables |
| `db/migrations-2026-08-post-slugs.sql` | ⏳ NOT YET APPLIED |
| `db/migrations-2026-08-ministries-nav.sql` | ⏳ NOT YET APPLIED |

---

## Architecture notes
- **No basePath.** `lib/basePath.js` has `BASE_PATH = ''`. `asset()` is a no-op passthrough. Do not re-add basePath.
- **Admin JS is NOT compiled by Next.** `public/admin/*.js` and `public/editor.js` are raw browser JS. Always run `node --check <file>` before committing. Syntax errors there won't show in `npm run build`.
- **Nav is DB-driven.** `STATIC_LINKS` in Header.js is a fallback only (pre-load + if DB empty). Real nav comes from `nav_items` table. To permanently add/remove a nav item, use admin → Navigation OR run a SQL migration.
- **Ministry names with apostrophes** — `esc()` does not escape `'`. Use `jsq()` (defined in views.js) whenever passing a string value into a single-quoted JS argument inside an HTML `onclick` attribute.
- **Rich text saves as HTML.** Post body in DB is raw HTML. It is sanitized server-side by `sanitizeHtml()` (DOMPurify, lazy import) before `dangerouslySetInnerHTML`. Do not remove sanitization.
- **Image uploads** go through `/api/compress-image` → WebP → Supabase `media` bucket. The admin `DB.upload()` and the visual editor both compress first with a silent fallback to original.
