# Oasis Christian Centre — Website

Next.js app (App Router) + Supabase, deployed on the church server behind a
Tailscale/proxy setup. Runs `next start` on port **5900** with `basePath: /website`.

---

## Documentation index

| Doc | What it covers |
|---|---|
| **`CHANGELOG-2026-07.md`** | ⭐ Start here. Everything done since the Next.js migration, SQL to run, env vars, key files map. |
| **`SERVER-COMMANDS.md`** | Deploy / restart / debug commands for the server. |
| **`ADMIN-SOP.md`** | Plain-language guide for the team (non-technical). |
| **`SUPABASE-GUIDE.md`** | Backend architecture, tables, RLS policies. |
| **`VISUAL-EDITOR.md`** | How the inline "edit the real page" CMS works. |
| **`AUDIT.md`** | Original audit + current status of each item. |

---

## Deploy (server)

```bash
cd ~/website2
git pull origin main
rm -rf .next
npm run build
fuser -k 5900/tcp
setsid npm run start > ~/website2/app.log 2>&1 < /dev/null &
sleep 8 && tail -5 ~/website2/app.log
```

Full details + troubleshooting in `SERVER-COMMANDS.md`.
**Never run `next dev` in production** (breaks CSS). Always `rm -rf .next` before rebuild.

---

## First-time / after-pull setup

1. **SQL** (Supabase SQL editor) — run `db/migrations-2026-07.sql` once.
2. **Env** — create `~/website2/.env.local` on the server:
   ```
   RESEND_API_KEY=re_xxxxxxxx
   RESEND_FROM=Oasis Website <noreply@hub.oasisnj.net>
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
   SUPABASE_SECRET_KEY=sb_secret_xxxxx
   NEXT_PUBLIC_SITE_URL=https://oasisnj.net
   ```
3. Build + restart (above).

---

## What the site does

- **Content** (text, images, events, nav, settings) is edited in the **Admin panel**
  (`/admin`) or via the **inline Visual Editor**, stored in Supabase.
- **Watch page** pulls messages from YouTube (@OCCNJ) and shows a live
  **Twitch / YouTube / Facebook** tabbed player. Live/offline switches automatically
  on the Sunday service schedule (9:55–11:20 AM ET, `lib/serviceWindow.js`).
- **Forms** send email via **Resend**: prayer → pastoral team, all else → oasis@.
- **Giving** is never processed by this website; every Give control opens the
  Admin-configured external provider.

---

## Tech stack

- Next.js 15 (App Router, server components)
- Supabase (Postgres + Auth + Storage)
- Resend (transactional email)
- Restream (live stream distribution to Twitch/YouTube/Facebook)
- Deployed on the church's own server (port 5900, `/website` base path)

Credential handling and incident-response steps are documented in `SECURITY.md`.
