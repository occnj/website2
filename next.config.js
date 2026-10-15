// The browser talks to the database API directly (admin, visual editor), so
// the Content-Security-Policy must allow its origin: PIBASE at
// NEXT_PUBLIC_SUPABASE_URL (e.g. https://pibase.oasisnj.net), plus Supabase
// hosts for older setups.
function apiOrigins() {
  const out = ['https://*.supabase.co', 'wss://*.supabase.co'];
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
    if (u.protocol === 'https:' || u.protocol === 'http:') {
      out.push(u.origin, (u.protocol === 'https:' ? 'wss://' : 'ws://') + u.host);
    }
  } catch { /* not set */ }
  return out.join(' ');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  env: {
    // Keep unhashed public/admin assets in lockstep with each deployment.
    ADMIN_ASSET_VERSION: process.env.ADMIN_ASSET_VERSION ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      Date.now().toString(),
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Short vanity URLs for each ministry — easy to share with church members
      { source: '/wow',        destination: '/ministries/wow-women',      permanent: false },
      { source: '/fmo',        destination: '/ministries/fmo-men',        permanent: false },
      { source: '/youth',      destination: '/ministries/the-collective', permanent: false },
      { source: '/kids',       destination: '/ministries/kids',           permanent: false },
      { source: '/journey',    destination: '/ministries/the-journey',    permanent: false },
      // The Mission Blog has its own page at /missions.
      { source: '/ministries/missions', destination: '/missions', permanent: false },
      { source: '/ministries/missions/:postId', destination: '/missions/:postId', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' " + apiOrigins() + " https://www.youtube.com https://www.googleapis.com https://api.twitch.tv; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.twitch.tv https://www.facebook.com https://www.google.com https://maps.google.com; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests" },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
