// Oasis Admin — Supabase connection
// Fill these in from Supabase Dashboard → Settings → API.
// The anon key is safe to expose in the browser; Row-Level Security protects the data.
// NEVER put the service_role key or any password in this file.
window.OASIS_CONFIG = Object.assign({
  // The global administrator signs in with the username "Oasis".
  // Supabase Auth uses emails, so the username maps to this account:
  ADMIN_USERNAME: 'Oasis',
  ADMIN_EMAIL: 'admin@oasisnj.net',

  // Donation page (editable later in Admin → Giving; this is the fallback)
  DONATE_URL: 'https://thekingdomledger.com/donate?code=2335',
}, window.OASIS_RUNTIME_CONFIG || {});
