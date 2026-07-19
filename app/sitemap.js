const ROUTES = ['', '/about', '/plan-your-visit', '/watch', '/events', '/leadership', '/prayer', '/contact', '/give'];

export default function sitemap() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://oasisnj.net';
  return ROUTES.map((path) => ({
    url: `${origin}/website${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/events' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}
