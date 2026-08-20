import { getMinistries, getMinistryPosts } from '@/lib/data';

const STATIC_ROUTES = ['', '/about', '/plan-your-visit', '/watch', '/events', '/leadership', '/prayer', '/contact', '/give'];

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://oasisnj.net';
  const now = new Date();

  const entries = STATIC_ROUTES.map((path) => ({
    url: `${origin}/website${path}`,
    lastModified: now,
    changeFrequency: path === '/events' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));

  // Ministry landing pages + their blog posts (best-effort; falls back to the
  // static routes above if the data layer is unreachable).
  try {
    const ministries = await getMinistries();
    for (const m of ministries) {
      entries.push({
        url: `${origin}/website/ministries/${m.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
      const posts = await getMinistryPosts(m.id);
      for (const p of posts) {
        entries.push({
          url: `${origin}/website/ministries/${m.slug}/${p.id}`,
          lastModified: p.published_at ? new Date(p.published_at) : now,
          changeFrequency: 'monthly',
          priority: 0.5,
        });
      }
    }
  } catch {
    // ignore — static routes are already included
  }

  return entries;
}
