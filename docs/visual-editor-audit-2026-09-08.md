# Visual editor audit — 8 September 2026

The About welcome paragraphs are source defaults. The existing `page_overrides`
store remains the publishing mechanism; no schema migration or new CMS is needed.

## Fixed

- Text detection no longer treats mixed layout containers as a single editable
  HTML block. Paragraphs remain separately editable.
- **All text** exposes direct text (including punctuation), hidden answers,
  placeholders, dropdown labels, image descriptions, and accessibility labels.
  Changes to these targets preserve child elements and event handlers.
- Form success/submitting labels and live/offline wording stay mounted as hidden
  variants so staff can edit them without triggering a real submission.
- Form submission is blocked in edit mode. Alt-click opens interactive controls;
  reopen All text to edit content newly revealed by a tab or menu.
- Published overrides are reapplied when client-rendered content changes.
  Route changes load a fresh document to avoid carrying one page's overrides or
  editor listeners onto another page.
- Event and sermon edits follow record IDs through filtering. Nested pages use
  the full path for storage, with a read fallback to old last-segment records.
- Failed content loads disable publishing instead of silently starting from an
  empty record. Drafts are recovered, local saves use the same draft key, and
  typing is saved before blur. Publish uses a snapshot, prevents duplicate requests,
  and retains newer edits made during an outstanding request.
- Added blocks restore into ordinary containers along with their saved edits.
  Editor chrome is excluded from element keys. All text can restore hidden sections.
- Link input no longer interpolates raw href values into HTML. Unsafe URL schemes
  are rejected. Image replacements clear competing srcset values. Upload failures
  are surfaced, and failed script tags can be retried.
- Life-event forms retain the form element across asynchronous submission before
  resetting it, avoiding a false failure after successful submission.

## Verification

Regression tests cover independent paragraph edits, exact punctuation, mixed
text, hidden answers, form hints and options, added blocks, editor key stability,
draft recovery, failed-load blocking, record filtering, and in-flight publication.
The rendered-route audit round-tripped 947 targets from the pre-change running
site: nine rendered pages plus the Give and Life Events redirect responses.
Life Events content is embedded in Events. No ministry detail links were present
in the fetched pages, so their live content was not exercised.

Run `npm test`, `npm run lint`, and `npm run build`. The optional
`scripts/audit-visual-content.mjs` reads route HTML fixtures from `/tmp/oasis-*.html`.

## Practical limits

This edits content rendered by Oasis, not text inside externally hosted donation
pages, video players, or other cross-origin embeds. Arbitrary server-generated
error messages are not a static editorial catalog. Content created later becomes
editable when it renders. Existing DOM-path overrides can still require review
following structural redesigns; this patch retains the existing storage format.
A real authenticated publish against Supabase has not been performed during this
audit, to avoid changing church copy. Publication behavior is tested with a store
stub; live authentication, permissions, and media uploads need a staff-session check.
