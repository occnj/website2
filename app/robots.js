export default function robots() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://oasisnj.net';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
