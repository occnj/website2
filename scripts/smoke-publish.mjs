#!/usr/bin/env node
// ============================================================
// Oasis CMS — visual-editor publish smoke test (live Supabase)
//
// Closes the one gap the automated tests can't: they use a store
// stub, so the real auth -> RLS -> write -> public read chain has
// never been exercised end to end. This script does exactly that
// against a live project, using a THROWAWAY slug so it can never
// touch real church copy, and it cleans up after itself.
//
// What it verifies, in order:
//   1. A staff member can authenticate (email + password).
//   2. RLS lets that authenticated role UPSERT into page_overrides.
//   3. The anon (public) client can then READ the row back — proving
//      the live site would actually apply the edit.
//   4. An UNAUTHENTICATED write is REJECTED by RLS (negative check).
//   5. Cleanup: the throwaway row is deleted.
//
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... \
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   OASIS_SMOKE_EMAIL=staff@example.org \
//   OASIS_SMOKE_PASSWORD=... \
//   node scripts/smoke-publish.mjs
//
// Exit code 0 = all checks passed. Non-zero = a check failed.
// Nothing here writes to a real page slug; the slug is namespaced
// under "__smoke/" and deleted at the end (and best-effort on error).
// ============================================================
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const EMAIL = process.env.OASIS_SMOKE_EMAIL || '';
const PASSWORD = process.env.OASIS_SMOKE_PASSWORD || '';

function need(name, value) {
  if (!value) { console.error(`✗ missing required env var: ${name}`); process.exitCode = 2; return false; }
  return true;
}
const ok =
  [['NEXT_PUBLIC_SUPABASE_URL', URL], ['NEXT_PUBLIC_SUPABASE_ANON_KEY', ANON],
   ['OASIS_SMOKE_EMAIL', EMAIL], ['OASIS_SMOKE_PASSWORD', PASSWORD]]
  .map(([n, v]) => need(n, v)).every(Boolean);
if (!ok) {
  console.error('\nSet the four variables above (the two NEXT_PUBLIC_* are already in your deployment env).');
  process.exit(2);
}

// A slug that is obviously not a real page and is easy to spot / purge.
const SLUG = `__smoke/${new Date().toISOString().replace(/[:.]/g, '-')}`;
const MARKER = `smoke-${Math.random().toString(36).slice(2)}`;

let failures = 0;
function pass(msg) { console.log(`✓ ${msg}`); }
function fail(msg, err) { failures++; console.error(`✗ ${msg}${err ? ' — ' + (err.message || err) : ''}`); }

async function main() {
  const anonClient = createClient(URL, ANON, { auth: { persistSession: false } });

  // ---- 4 (set up first, before we authenticate): anon write must be denied ----
  // Done on a separate anon client so the later authed client is clean.
  {
    const probe = createClient(URL, ANON, { auth: { persistSession: false } });
    const { error } = await probe.from('page_overrides')
      .upsert({ slug: SLUG + '-anon', edits: { text: { x: 'should not persist' } } });
    if (error) pass('unauthenticated write is rejected by RLS (negative check)');
    else { fail('unauthenticated write was NOT rejected — RLS is not protecting page_overrides'); }
  }

  // ---- 1: authenticate as staff ----
  const staff = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: auth, error: authErr } =
    await staff.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authErr || !auth?.user) { fail('staff authentication', authErr); return; }
  pass(`authenticated as ${auth.user.email}`);

  // ---- 2: authenticated upsert ----
  const payload = {
    slug: SLUG,
    edits: { text: { 'smoke>p:1': MARKER }, sig: { 'smoke>p:1': 'original' } },
    updated_at: new Date().toISOString(),
    updated_by: auth.user.id,
  };
  const { error: writeErr } = await staff.from('page_overrides').upsert(payload);
  if (writeErr) { fail('authenticated upsert into page_overrides (check the "staff write" RLS role)', writeErr); }
  else pass('authenticated upsert accepted by RLS');

  // ---- 3: public read-back returns exactly what we wrote ----
  const { data: readData, error: readErr } =
    await anonClient.from('page_overrides').select('edits').eq('slug', SLUG).maybeSingle();
  if (readErr) fail('public read-back', readErr);
  else if (!readData) fail('public read-back returned no row (public read policy missing?)');
  else if (readData.edits?.text?.['smoke>p:1'] !== MARKER) fail('public read-back returned different content than written');
  else pass('public (anon) client reads the published edit back intact');

  // ---- 5: cleanup ----
  const { error: delErr } = await staff.from('page_overrides').delete().eq('slug', SLUG);
  if (delErr) fail(`cleanup delete (please remove slug "${SLUG}" manually)`, delErr);
  else pass('throwaway row deleted');

  await staff.auth.signOut().catch(() => {});
}

main()
  .catch((err) => fail('unexpected error', err))
  .finally(() => {
    console.log('');
    if (failures) { console.error(`SMOKE TEST FAILED (${failures} check${failures > 1 ? 's' : ''}).`); process.exit(1); }
    console.log('SMOKE TEST PASSED — the live publish path works end to end.');
  });
