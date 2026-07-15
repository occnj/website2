// Oasis Admin — Supabase connection
// Fill these in from Supabase Dashboard → Settings → API.
// The anon key is safe to expose in the browser; Row-Level Security protects the data.
// NEVER put the service_role key or any password in this file.
window.OASIS_CONFIG = {
  SUPABASE_URL: 'https://twdyeqnlxzvanylhqnjf.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZHllcW5seHp2YW55bGhxbmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NzUxNjMsImV4cCI6MjA5OTU1MTE2M30.OHzwlusEyT1CMeyTG3RWR45UutTD7IgRhJXEWWHUYyU',

  // The global administrator signs in with the username "Oasis".
  // Supabase Auth uses emails, so the username maps to this account:
  ADMIN_USERNAME: 'Oasis',
  ADMIN_EMAIL: 'admin@oasisnj.net',

  // Donation page (editable later in Admin → Giving; this is the fallback)
  DONATE_URL: 'https://thekingdomledger.com/donate?code=2335',
};
