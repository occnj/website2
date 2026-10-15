# Running the website on PIBASE

PIBASE (https://pibase.oasisnj.net) is the website's backend: database, sign-in
and image storage. It speaks the same protocol as Supabase, so the site keeps
using `@supabase/supabase-js`; only the address and keys change.

Staff accounts are PIBASE users. The admin (`/admin`) has a **PIBASE Dashboard**
link (Settings section) for managing users, backups and data.

## 1. Create the project

In the PIBASE dashboard create a project (for example `oasis-web`), and in its
**Settings → API address** set `https://pibase.oasisnj.net`. On the server, if
that name isn't served yet: `scripts/add-domain.sh pibase.oasisnj.net` (as root,
in the pibase folder).

## 2. Create the database

On the PIBASE server, from the pibase folder (`/home/pibase/pibase`):

```sh
/path/to/website2/scripts/pibase-migrate.sh PROJECT_ID
```

It applies, in order: `db/pibase/000-setup.sql` (the Supabase setup adapted
for PIBASE), every `db/migrations-*.sql`, `db/pibase/100-storage-rules.sql`
and `db/migrations-2026-10-redesign.sql`. Re-running it is safe.

PIBASE differences handled by these files:

| Supabase | PIBASE |
|---|---|
| Policies on `storage.objects` for the `media` bucket | `public.storage_write_allowed()` (`db/pibase/100-storage-rules.sql`), same rules: staff upload; while change approval is on, only Owner/Admin may overwrite or delete files |
| Filtering on an embedded table (`pages!inner(slug)`) and `nullsFirst` ordering | not supported — `lib/data.js` uses plain queries that work on both |

## 3. Environment (`.env.local` on the web server)

```
NEXT_PUBLIC_SUPABASE_URL=https://pibase.oasisnj.net
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<the project's anon key>
SUPABASE_SECRET_KEY=<the project's service key — server only>
NEXT_PUBLIC_PIBASE_DASHBOARD_URL=https://pibase.oasisnj.net
```

The keys are on the dashboard's **API keys** page. The variable names stay
`SUPABASE_*` because the site still uses the Supabase client library. The
Content-Security-Policy in `next.config.js` allows the address in
`NEXT_PUBLIC_SUPABASE_URL` automatically. Rebuild after changing these
(`rm -rf .next && npm run build`).

## 4. First owner account

1. Dashboard → the project → **Users → Add user**: `admin@oasisnj.net` with a
   strong password (the admin login's "Oasis" username maps to this email).
2. Copy the new user's ID and run in the dashboard's **SQL** page:
   ```sql
   insert into profiles (id, full_name, role) values ('<USER-ID>', 'Oasis', 'owner');
   ```
3. Other staff: create them in the dashboard, then add them in Admin → Users & Roles.

## Moving the existing content from Supabase

The migrations above create the tables with the starter content. To bring the
current live content across instead, export the `public` tables' data from
Supabase (Dashboard → Database → Backups, or `pg_dump --data-only --schema=public`)
and load it with the dashboard's SQL page after step 2. Staff logins are
recreated in PIBASE (step 4); PIBASE can also import existing bcrypt password
hashes through its admin API (`password_hash`, see PIBASE's COMPATIBILITY.md).
Images in the Supabase `media` bucket need re-uploading (or copying into the
PIBASE storage folder) and the stored image URLs updating to the new address.

## New in the October 2026 redesign

- **Livestream & Service Times** (admin): the home hero becomes the Twitch
  livestream on Sundays from 9:55 AM (window and day editable). *Force LIVE* /
  *Force OFF* switch it for everyone; preview links (`/?live=1`, `/?live=0`,
  `/?now=2026-10-18T09:55`) only affect the person viewing.
- **Events** can repeat: every N days/weeks (any weekdays), monthly by date,
  monthly by weekday (1st & 3rd Thursday, last Friday…), yearly; end on a date or
  after N times; skip single dates. Logic: `lib/recurrence.js`.
- **Mission Blog** (`/missions`) is the "missions" ministry's blog — Admin →
  Mission Blog.
- **Serve** (`/serve`) lists open volunteer positions — Admin → Serve Positions.
