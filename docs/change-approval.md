# Change approval, history and undo

When approval is switched on, a change made by an **editor** or **events_only** account —
in the Visual Editor or the Admin panel — does **not** go live. It waits until an approver
confirms it. Owners and admins always publish directly.

## How it works

1. A volunteer edits and presses Publish / Save. They see **"Sent for approval"**. The live site is unchanged.
2. Every approver gets an email showing the old wording → new wording, with a **Review & approve** button.
   Changes to links, site-wide settings and deletions are flagged "Look closely".
3. The button opens a review page with **Approve & publish** and **Reject** (with an optional note).
   Approving publishes the change immediately. The same can be done in **Admin → Approvals**.
4. Everything that goes live is recorded in **Admin → Change History** (who asked, who approved,
   before/after), where an owner/admin can **Undo** it.

Opening the email link never approves anything by itself — only pressing the button does. This is
deliberate: mail scanners and link previews open links automatically.

The rule is enforced by the database, not by the web pages, so it cannot be bypassed from a browser.

## One-time setup

1. **SQL** — Supabase SQL Editor → run `db/migrations-2026-10-change-approval.sql`.
   It only adds things, never touches existing content, and is safe to re-run.
   *(Never run `supabase-setup.sql` on the live site — it drops tables.)*
   Running it changes nothing for editors yet: approval starts **off**.
2. **Deploy** the website (`SERVER-COMMANDS.md`). The server `.env.local` must have
   `RESEND_API_KEY`, `SUPABASE_SECRET_KEY` and `NEXT_PUBLIC_SITE_URL` (the address approvers will
   open, e.g. `https://oasisnj.net`). All three are already used by the contact forms. If approvers
   should use a different address, set `CHANGE_REVIEW_BASE_URL` instead.
3. **Switch it on** — sign in as Owner/Admin → **Settings → Change approval**: enter the approver
   emails, tick *Require approval*, Save.
4. **Try it** — sign in as an editor, change a word on a page, Publish. Check the email arrives and approve it.

Do step 2 before step 3. If approval is on but the old website code is still running, editors will
see "Published" while their change is actually waiting.

## Everyday use

| Who | Where | What |
|---|---|---|
| Approver | Email → Review & approve | Approve or reject one change, no sign-in needed |
| Owner/Admin | Admin → Approvals | See everything waiting; approve or reject |
| Owner/Admin | Admin → Change History | See what went live; Undo |
| Editor | Admin → Approvals | See their own requests, the outcome and any note; Withdraw |

- If an editor saves the same item again before it is approved, their request is updated (one request per item per person) and approvers get a fresh email.
- If someone else changed the same thing in the meantime, approving stops and asks before overwriting it.
- Reordering items (the ↑↓ arrows) is not held for approval.

## Good to know

- **The email link is the key.** Anyone who has an approver's link can approve that one change
  without signing in. Each approver gets their own link, the decision is recorded under their
  address, links stop working once the change is decided, and they expire after 30 days. List only
  trusted people as approvers and don't forward the emails.
- **Editors are not emailed** when a change is approved or rejected; they see it in Admin → Approvals.
- **Media files:** while approval is on, editors can upload new images but cannot replace or delete
  existing files (that would change the live site instantly). Owners/admins can.
- **In the Admin panel**, an editor's lists keep showing the live values until their change is
  approved. The Visual Editor does show them their own waiting version.
- **Undoing a creation** deletes the item (and anything that depends on it). Deleted image files are not restored.
- **User accounts and form/approval settings** can only be changed by owners/admins, so they are
  recorded in history but never held.
- To cover a table added later, add its name to `content_revision_tables()` in the SQL file and re-run it.
