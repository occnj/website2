# Oasis Admin — Standard Operating Procedures (SOP)

Plain-language guide for the team. Technical setup lives in `SUPABASE-GUIDE.md`.

---

## 1. Logging In

1. Go to `oasisnj.net/admin`
2. Enter your church email + password
3. Forgot password? Click "Forgot password" — a reset link is emailed to you (Supabase Auth handles this automatically)

**Never share logins.** Each of the 6 team members has their own account so every change is tracked by name.

---

## 2. Creating / Managing Users (Admins only)

### Invite a new team member
1. Admin panel → **Users & Roles** → **+ Invite Team Member**
2. Enter their email → they receive an invite link to set their password
3. Choose their role (see table below)

Behind the scenes (for whoever administers Supabase):
- Supabase Dashboard → Authentication → Users → **Invite user**
- Then add a row in `profiles`: their user id + role
- Public signups must stay **disabled** (Auth → Providers → Email → signups off)

### Roles

| Role | Can do |
|---|---|
| **Admin** | Everything — pages, users, payment links, all content |
| **Editor** | Pages, media, events, sermons, team profiles, nav/footer, inbox |
| **Events only** | Add/edit events, nothing else |

### Suspend vs. delete
- **Suspend** (Users & Roles → Suspend): blocks all access immediately, keeps the account — use for temporary leave
- **Delete** (trash icon): permanently revokes access; a confirmation is shown first, and the change is recorded in the Activity Log
- The **Owner** account is protected and cannot be suspended or deleted
- Do this the same day someone leaves the team

---

## 3. Everyday Tasks

### Change the home hero image
1. **Pages → Home → Edit**
2. Click the hero image → pick from Media Library or upload new
3. **Publish Changes** — live within seconds
- Use landscape photos, at least 1920px wide, under 1MB (export as JPG)

### Edit any text on the site
Pages → pick the page → Edit → change the field → **Publish Changes**

### Add an event
1. **Events → + Add Event**
2. Fill title, date, time, location, category, description
3. Toggle **Feature on home page** for big events (only 1–2 featured at a time)
4. Save — it appears on the Events page and home page automatically
- Past events drop off the site automatically; no need to delete them

### Sermons
- Upload the video to YouTube as normal — it appears in the admin within the hour (or press **Sync Now**)
- Then open it and fill in **Series** and **Speaker**, and set **Featured** for the latest message

### Update the donation link (Admins only)
1. **Giving** → paste the new Kingdom Ledger link → Save
2. Click **Test Link** and complete a $1 gift before announcing

### Navigation & footer
**Navigation** tab → drag to reorder menu items, toggle to hide, edit footer/socials → Save

---

## 4. House Rules

- **Publish means live.** There's no second approval step — proofread before publishing
- One person edits a page at a time (coordinate in the team chat)
- Photos: get consent before posting faces, especially kids
- Keep image files under 1MB; the Media Library shows what's already available — reuse before uploading duplicates

---

## 5. If Something Breaks

| Problem | Do this |
|---|---|
| Can't log in | Forgot-password link; if still stuck, an Admin re-invites you |
| Change not showing | Hard-refresh (Ctrl/Cmd+Shift+R); wait 1 min |
| Sermon missing | Check it's Public on YouTube, then Sync Now |
| Site down | Check status.supabase.com and your host's status page; contact the developer |

**Developer contact:** _(fill in name / phone / email)_

---

## 6. Deployment — Go-Live Runbook

Do these in order (developer + one admin):

1. **Supabase project** — create, run `supabase-setup.sql` in the SQL Editor
2. **Storage** — create `media` bucket, upload logo + current photos
3. **Seed content** — copy the current site's text into `pages` / `page_blocks`
4. **Host** — set up the DigitalOcean droplet (Nginx + SSL, see SUPABASE-GUIDE.md); point oasisnj.net DNS
5. **Wire data** — connect pages to Supabase reads; verify every page renders from the DB
6. **Edge Function** — YouTube sync cron (optional; sermons can be added manually)
7. **Giving** — verify the Kingdom Ledger donation link, test a $1 gift
8. **Users** — invite all 6, set roles, **disable public signup**, everyone logs in once
9. **Mobile check** — walk every page on a phone
10. **Backups** — Supabase daily backups are on by default (verify in dashboard)
11. **Handoff** — 30-min team walkthrough of this SOP; fill in developer contact above
