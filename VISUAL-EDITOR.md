# Oasis — Inline Visual Editor

An Elementor-style, edit-the-real-page CMS layer for the existing site. No
per-field setup: **every** heading, paragraph, button, image and section
becomes editable in place.

## One-time setup

1. In the Supabase SQL Editor, run **`db/overrides.sql`** (after
   `supabase-setup.sql`). It adds the `page_overrides` table + RLS.
2. The editor uploads into the existing public **`media`** bucket
   (`inline/` folder) — no extra bucket needed.

## How staff use it

- In the admin (`/admin` → **Pages**), click **“Visual edit ↗”** on any page.
  It opens the real page with `?edit=1`.
- Or add `?edit=1` to any page URL while signed in.
- Then:
  - **Click any text** → type to edit in place (inline formatting kept).
  - **Click any image / placeholder**, or **drag a file onto it** → uploads &
    replaces it (this is what the old hero upload failed to do).
  - **🔗 Edit link** on any button → change where it points.
  - **▤ Section ▾** → background colour, hide/show a whole section, or
    **＋ add a text / image block** anywhere.
- **Publish** writes live to Supabase (staff only). Not signed in → changes
  save to a local draft so you can preview safely.

## How it works

- `cms-core.js` gives every element a **stable key from its DOM path**. The
  editor records edits under those keys; the public site re-applies them on load
  via `CmsBridge` → `OASIS.applyEdits`. Same algorithm both sides → nothing
  hand-tagged.
- **Text detection (upgraded July 2026):** instead of a fixed selector whitelist,
  `cms-core.js` now detects text blocks generically — any element whose contents
  are plain inline text is editable, and every `<a href>` gets a link editor. This
  means addresses, phone numbers, stats, and span/div-based text are all editable,
  not just headings and paragraphs.
- `editor.js` is the editing UI. It only activates with `?edit=1` (or the
  `oasis_edit` localStorage flag); otherwise it does nothing, so visitors never
  see it. `CmsBridge.js` decides which to load per page.

## Note on the old hero upload

The original static-site `site-data.js` looked for `.hero` / `.page-hero`, but the
home hero is `.hero-home` with a CSS-background overlay (no `<img>`), so uploads
were skipped. The generic override layer now targets the actual element by path.
The form-based **Fields** editor in Admin still works alongside this for structured
content (events, sermons, team, settings).
