# Website Audit — Oasis Christian Centre
*Audited: all 9 public pages + admin panel + nav.js + styles.css · Target: DigitalOcean Droplet*

---

## Verdict

Structure, navigation, mobile layout, and internal links are **solid — no broken links, every page has viewport meta, all images have alt text.** What blocks go-live is **content placeholders and unwired backend**, plus a few small technical gaps. Details below, ordered by severity.

---

## 🔴 Blockers (fix before launch)

1. **Admin login is a prototype, not real security.** `admin.html` "Sign In" is cosmetic — anyone who finds `/admin` gets in. Before deploying: wire real Supabase Auth, and additionally block `/admin` at the Nginx level (see droplet config below) until that's done.
2. **Contact/prayer forms don't submit anywhere.** They need the Supabase `messages` insert + email Edge Function (per SUPABASE-GUIDE.md), or at minimum a mailto/Formspree stopgap.
3. **Placeholder phone numbers** — `(732) 555-01xx` appears on Plan Your Visit and Contact. Replace with the real number.
4. **Address inconsistency** — footer (nav.js) says *15 Main St*; other materials say *1600 Church St*. Pick one, fix everywhere.
5. **Give page payment links not wired** — Stripe Payment Links must exist and be tested before the Give button goes live.
6. **Photo placeholders on every page** — heroes, leadership headshots, events, life-events all use placeholder frames. Site will look unfinished without real photography. (Leadership names/bios also need real content.)

## 🟠 Should fix

7. **Footer social links go nowhere** (`href="#"` for fb/ig/yt). Add real URLs or remove the icons.
8. **Missing meta descriptions** on events.html, life-events.html, give.html (others have them). Hurts Google snippets.
9. **Watch page sermons are static** — fine for launch if they're real videos; the YouTube sync replaces this later.
10. **No favicon** — browsers will show a blank tab icon. Add one from the logo.
11. **No 404 page** — add a simple branded 404.html (Nginx serves it, config below).

## 🟡 Nice to have

12. `loading="lazy"` on below-the-fold images (matters once real photos land).
13. `robots.txt` + `sitemap.xml` for SEO.
14. Header/footer are injected by nav.js at runtime — content still indexes fine, but if SEO becomes a priority, inline them at build time.
15. Open Graph tags (`og:image`, `og:title`) so links shared on socials/WhatsApp show a preview card.

## ✅ Passed

- All internal links resolve (checked every href across 10 pages)
- Every page: viewport meta, unique title, single shared stylesheet
- All `<img>` tags have alt text
- Mobile: grids stack, heroes scale, hamburger nav works (from the recent mobile pass)
- Consistent shared header/footer via nav.js — one place to edit
- No external JS dependencies on public pages — fast and nothing to break

---

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
