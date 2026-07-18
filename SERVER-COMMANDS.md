# Oasis Website — Server Commands

All commands run on the server as `occnj@occnj` in `~/website2`.

---

## Deploy an update (standard flow)

Run these **one at a time**, waiting for each to finish:

```bash
cd ~/website2
git pull origin main
rm -rf .next
npm run build
```

Wait for the build to complete — you'll see the route table ending with `ƒ (Dynamic)`.  
Then restart:

```bash
fuser -k 5900/tcp
setsid npm run start > ~/website2/app.log 2>&1 < /dev/null &
sleep 8 && tail -5 ~/website2/app.log
```

You should see `✓ Ready in ...ms`. Then hard-refresh the browser (`Ctrl+Shift+R`).

---

## Check if the server is running

```bash
ps aux | grep "next start" | grep -v grep
```

Or check the port:

```bash
fuser 5900/tcp
```

---

## View live server logs

```bash
tail -50 ~/website2/app.log
```

Follow in real time:

```bash
tail -f ~/website2/app.log
```

---

## Restart without pulling (e.g. after a config change)

```bash
fuser -k 5900/tcp
setsid npm run start > ~/website2/app.log 2>&1 < /dev/null &
sleep 8 && tail -5 ~/website2/app.log
```

---

## Rebuild without restarting (e.g. to check for errors)

```bash
cd ~/website2
npm run build
```

---

## Kill the server (emergency stop)

```bash
fuser -k 5900/tcp
```

Or if fuser isn't available:

```bash
kill $(lsof -ti:5900)
```

---

## Port already in use on startup?

Means the old process is still alive. Kill it first:

```bash
fuser -k 5900/tcp
sleep 2
setsid npm run start > ~/website2/app.log 2>&1 < /dev/null &
```

---

## Check which build/commit is deployed

```bash
git log --oneline -5
```

Compare against GitHub to see if you're behind:

```bash
git fetch origin && git status
```

---

## Full reset (nuclear option — wipes build cache)

```bash
cd ~/website2
git fetch origin
git reset --hard origin/main
rm -rf .next node_modules
npm install
npm run build
fuser -k 5900/tcp
setsid npm run start > ~/website2/app.log 2>&1 < /dev/null &
sleep 8 && tail -5 ~/website2/app.log
```

---

## Important notes

- **Never run `npm run dev` in production.** Dev mode serves CSS differently
  and was the cause of the "no CSS on the site" issue. Always use `npm run start`
  after a build.
- **Always `rm -rf .next` before rebuilding** after CSS or layout changes.
  Stale build chunks can survive a rebuild and serve broken styles.
- **`setsid ... < /dev/null &`** is the correct way to background the server
  so it survives when you close the SSH session. Plain `nohup ... &` gets
  Terminated when the terminal closes.
- The app runs on port **5900** with `basePath: /website` (see `next.config.js`).
- Logs go to `~/website2/app.log`.

---

## Supabase SQL (run once in the Supabase SQL editor)

Run the full idempotent migration file `db/migrations-2026-07.sql` in the
Supabase SQL Editor. Do **not** run `supabase-setup.sql` on an existing site; that
file is a destructive fresh-install script.

Afterward, open Admin → Settings and save Prayer and Regular form recipients.
The server `.env.local` must also contain `SUPABASE_SERVICE_ROLE_KEY` so the email
API can read that private table.

---

## Admin panel

URL: `https://occnj.tail812f78.ts.net/website/admin`

Key things you can do without touching code:
- **Enable podcast section** — Navigation → Site info → toggle "Show podcast section"
- **Reorder nav menu** — Navigation & Footer → Main navigation → ↑↓ arrows
- **Add/edit/delete events** — Events tab
- **Change Twitch channel** — Navigation → Live player → Twitch channel field
  (leave blank to use the default `occnj`)
