// Oasis Admin — Supabase connection
// Project values are injected by Next.js from NEXT_PUBLIC_* environment variables.
// The anon key is necessarily public in the browser; Row-Level Security protects data.
// NEVER put the service_role key or any password in this file.
window.OASIS_CONFIG = Object.assign({
  // The global administrator signs in with the username "Oasis".
  // Supabase Auth uses emails, so the username maps to this account:
  ADMIN_USERNAME: 'Oasis',
  ADMIN_EMAIL: 'admin@oasisnj.net',

  // Donation page (editable later in Admin → Giving; this is the fallback)
  DONATE_URL: 'https://thekingdomledger.com/donate?code=2335',
}, window.OASIS_RUNTIME_CONFIG || {});
