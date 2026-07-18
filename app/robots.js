export default function robots() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://oasisnj.net';
  return {
    rules: [
      { userAgent: '*', allow: '/website/', disallow: ['/website/admin', '/website/api/'] },
    ],
    sitemap: `${origin}/website/sitemap.xml`,
  };
}
