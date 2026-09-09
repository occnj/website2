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
- Admin has its own workspace chrome; the public header and footer are hidden
  while managing content.
- Or add `?edit=1` to any page URL while signed in.
- Then:
  - **Click any visible text** → type to edit in place (inline formatting kept).
    Detection includes direct text inside mixed layout containers on every page;
    it is not limited to headings, paragraphs, or a selector whitelist.
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

## September 2026 reliability update

Use **All text** in the visual editor to search and edit wording, punctuation,
hidden content, form placeholders, dropdown labels, and image descriptions.
Form confirmation and livestream state wording is included. Alt-click a tab or
menu to operate it, then reopen All text for any newly rendered content. Forms
cannot submit while editing. All text also offers buttons to restore hidden sections.

Drafts recover after reload. Publishing is disabled if existing content could not
be loaded; reload to retry rather than overwriting saved changes. A successful
publish clears its draft only if no newer edits were made while saving.
See `docs/visual-editor-audit-2026-09-08.md` for verification and boundaries.

## Surviving a page redesign (orphan recovery)

Every edit is keyed by the element's DOM path, which changes if a page is later
restructured (a paragraph moves, a wrapper `<div>` is added, a section is
re-nested). To keep edits from silently vanishing, the editor now also stores the
**original text** of each edited element. When the public site loads and a key no
longer resolves, `cms-core.js` looks for an element whose current text still
matches that saved original and re-applies the edit there.

- Recovery is **conservative**: if two elements share the same text, or nothing
  matches, the edit is left unapplied rather than guessing wrong.
- When you open a page with `?edit=1`, any edits that could not be placed are
  surfaced in the editor status bar ("N saved edits could not be placed — click
  to review"). Clicking it opens a panel listing each un-placed edit, its saved
  value, and why it could not be matched. Nothing is lost: the values are shown
  so you can find the matching text on the page and re-enter it, then publish.
  (The same events are also logged to the browser console as `[OASIS] orphaned…`.)
- Old published rows created before this change simply have no signature and keep
  working exactly as before — the `edits.text` / `edits.copy` format is unchanged.

## Verifying the live publish path (smoke test)

The automated tests exercise publish logic against a store stub, so the real
auth → RLS → write → public-read chain is confirmed separately with a one-off
script that uses a throwaway slug (`__smoke/…`) and cleans up after itself — it
never writes to a real page.

```
NEXT_PUBLIC_SUPABASE_URL=…            # already in your deployment env
NEXT_PUBLIC_SUPABASE_ANON_KEY=…       # already in your deployment env
OASIS_SMOKE_EMAIL=staff@example.org   # a real staff login (owner/admin/editor)
OASIS_SMOKE_PASSWORD=…
npm run smoke:publish
```

It checks, in order: an unauthenticated write is rejected by RLS; a staff member
can sign in; the authenticated upsert is accepted; the anon/public client reads
the same content back; and the throwaway row is deleted. Exit code 0 means the
live publish path works end to end. Run it once after any change to the
`page_overrides` table, its RLS policies, or the Supabase keys.
