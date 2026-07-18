# Website Audit — Oasis Christian Centre
*Originally audited as a static site; migrated to Next.js + Supabase July 2026.
This file now tracks the current status of each item. For the full change history
see `CHANGELOG-2026-07.md`.*

---

## Verdict (updated July 2026)

The site is now a **Next.js app** (server-rendered, `basePath: /website`, port 5900)
backed by **Supabase**, deployed on the church's own server behind a Tailscale/proxy
setup. Most original blockers are **resolved**. Remaining work is mostly real content
(photos, bios) and a couple of settings values.

---

## 🔴 Original blockers — status

1. ~~Admin login is a prototype~~ → **RESOLVED.** Real Supabase Auth with per-user
   accounts and role-based access (`profiles.role`). Every change is audit-logged.
2. ~~Contact/prayer forms don't submit~~ → **RESOLVED.** Forms send real email via
   Resend (`app/api/contact/route.js`). Prayer → pastoral team; all else → oasis@.
   See CHANGELOG "Forms & email".
3. **Placeholder phone numbers** — still `(732) 555-01xx` in places. **Fix in
   Admin → Settings** (no code change needed).
4. **Address inconsistency** — verify the correct address and set it once in
   Admin → Settings; footer + pages read from there.
5. **Give page** — uses the Kingdom Ledger donate link
   (`thekingdomledger.com/donate?code=2335`), wired in nav + Give button. Confirm
   it's the correct destination.
6. **Photo placeholders** — heroes, leadership headshots, events still use
   placeholder frames. Upload real images via Admin → Media / Visual Edit.
   Leadership names/bios also need real content.

## 🟠 Should fix — status

7. ~~Footer social links go nowhere~~ → **PARTLY RESOLVED.** YouTube is wired
   (`@OCCNJ`); Facebook/Instagram read from Admin settings — set the URLs there.
8. **Meta descriptions** — most pages have them via Next.js `metadata`; verify
   events/life-events/give.
9. ~~Watch page sermons are static~~ → **RESOLVED.** Watch pulls live from the
   YouTube channel RSS feed; live stream via tabbed Twitch/YouTube/Facebook player.
10. **Favicon** — confirm one is set from the logo.
11. **404 page** — Next.js has a default `not-found`; a branded one can be added
    at `app/not-found.js` if desired.

## 🟡 Nice to have

12. `loading="lazy"` — already applied on sermon thumbnails; extend to other
    below-the-fold images once real photos land.
13. `robots.txt` + `sitemap.xml` for SEO.
14. Open Graph tags (`og:image`, `og:title`) for social/WhatsApp link previews.
15. Rotate the Resend API key (was committed as a fallback; repo is public).

## ✅ Passing

- All internal links resolve; nav reads from Supabase (`nav_items`).
- Server-rendered pages with unique titles/metadata.
- Mobile: grids stack, heroes scale, nav works.
- Shared header/footer components — one place to edit.
- Live streaming auto-switches live/offline on the service schedule.
- Inline Visual Editor covers all text + images + links.

---

## Historical note — original static-site deployment

The section below documents the *original* DigitalOcean static-site plan. It is
**superseded** by the current Next.js deployment (see `SERVER-COMMANDS.md` for the
live deploy process). Kept for reference only.



## DigitalOcean Droplet Deployment

A static site + Supabase backend fits a **basic $6/mo droplet** easily.

### Setup (Ubuntu 24.04)

```bash
# 1. Create droplet, point DNS: A record oasisnj.net → droplet IP (+ www)
ssh root@YOUR_IP
apt update && apt install -y nginx certbot python3-certbot-nginx

# 2. Upload the site
mkdir -p /var/www/oasis
# from your machine: rsync -av --exclude admin.html ./ root@YOUR_IP:/var/www/oasis/

# 3. HTTPS
certbot --nginx -d oasisnj.net -d www.oasisnj.net
```

### Nginx config — `/etc/nginx/sites-available/oasis`

```nginx
server {
  listen 80;
  server_name oasisnj.net www.oasisnj.net;
  root /var/www/oasis;
  index index.html;

  error_page 404 /404.html;

  # Lock admin down until real auth is wired (or permanently, as a second layer)
  location /admin {
    auth_basic "Oasis Admin";
    auth_basic_user_file /etc/nginx/.htpasswd;   # htpasswd -c /etc/nginx/.htpasswd pastor
    try_files $uri $uri/ =404;
  }

  # Cache static assets
  location ~* \.(css|js|png|jpg|jpeg|webp|svg|woff2)$ {
    expires 30d;
    add_header Cache-Control "public";
  }

  # Clean URLs: /about → about.html
  location / {
    try_files $uri $uri.html $uri/ =404;
  }

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN";
  add_header X-Content-Type-Options "nosniff";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

```bash
ln -s /etc/nginx/sites-available/oasis /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### Notes for droplet hosting

- **Supabase still hosts the DB/auth/storage/functions** — the droplet only serves HTML/CSS/JS. Everything in SUPABASE-GUIDE.md is unchanged; ignore its Vercel/Netlify mentions.
- **Updates:** re-run `rsync` after edits — until the Supabase wiring is done, content edits mean editing HTML and re-uploading. Once wired, editors use the admin panel and never touch the droplet.
- **Maintenance you now own** (vs. Vercel): `apt upgrade` monthly, certbot auto-renews (verify: `certbot renew --dry-run`), enable the DO firewall (allow 22, 80, 443 only), turn on DO weekly backups ($1.20/mo).
- **Optional:** put DO's free Cloudflare-style CDN in front later; not needed at this traffic level.

### Launch checklist (droplet edition)

- [ ] Fix blockers 1–6 above
- [ ] Droplet + DNS + Nginx + certbot HTTPS
- [ ] `.htpasswd` on /admin
- [ ] 404.html, favicon, meta descriptions
- [ ] Supabase project live (schema + RLS from SUPABASE-GUIDE.md)
- [ ] Forms submitting → inbox + email tested
- [ ] Stripe links tested with $1 gift
- [ ] DO firewall + backups on
- [ ] Test on a real phone over cellular
