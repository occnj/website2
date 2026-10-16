#!/usr/bin/env node
// Import team members from a published leadership page into the database
// (team_members), so they can be edited in Admin → Team. Photos are not copied.
//
// Run on the web server (it must be able to open the page), from ~/website2:
//
//   node scripts/import-team.mjs https://occnj.tail812f78.ts.net:10000/leadership
//        → dry run: lists who would be imported, changes nothing
//   node scripts/import-team.mjs https://occnj.tail812f78.ts.net:10000/leadership --apply
//        → saves them
//
// Options:
//   --after "Melissa"            import only the people listed AFTER the first
//                                name containing this (default "Melissa")
//   --section "Ministry Leaders" the Team section they go in (default)
//   --apply                      actually write to the database
//
// People already in the database (same name) get their role and bio updated;
// everyone else is added at the end of the list. Uses NEXT_PUBLIC_SUPABASE_URL
// and SUPABASE_SECRET_KEY from .env.local (server only — never in a browser).

import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const url = process.argv.slice(2).find((a) => /^https?:\/\//.test(a));
const after = arg('--after', 'Melissa');
const section = arg('--section', 'Ministry Leaders');
const apply = process.argv.includes('--apply');

if (!url) {
  console.error('usage: node scripts/import-team.mjs <leadership page URL> [--after "Melissa"] [--section "Ministry Leaders"] [--apply]');
  process.exit(2);
}

// ---------- read the page ----------
const res = await fetch(url, { headers: { 'User-Agent': 'oasis-team-import' } });
if (!res.ok) { console.error(`Could not open ${url}: HTTP ${res.status}`); process.exit(1); }
const doc = new JSDOM(await res.text()).window.document;

const clean = (s) => String(s || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim();

// The bio keeps its paragraphs: separate <p>s / <br>s become blank lines.
function bioText(el) {
  if (!el) return '';
  const parts = [];
  const ps = el.matches('p') ? [el] : [...el.querySelectorAll('p')];
  (ps.length ? ps : [el]).forEach((p) => {
    p.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    clean(p.textContent).split(/\n+/).map((x) => x.trim()).filter(Boolean).forEach((x) => parts.push(x));
  });
  return parts.join('\n\n');
}

// Cards as this website renders them (.leader-card / .leader-name / .leader-role / .leader-bio),
// or the older .team-card markup.
const cards = [...doc.querySelectorAll('.leader-card, .team-card')].map((card) => ({
  name: clean((card.querySelector('.leader-name, .team-name, h3, h4') || {}).textContent),
  role_title: clean((card.querySelector('.leader-role, .team-role') || {}).textContent),
  bio: bioText(card.querySelector('.leader-bio, .team-bio')),
})).filter((p) => p.name);

if (!cards.length) {
  console.error('No team cards found on that page. Send the first part of the page source to whoever maintains the site:');
  console.error(`  curl -s "${url}" | head -c 4000`);
  process.exit(1);
}

const start = cards.findIndex((p) => p.name.toLowerCase().includes(after.toLowerCase()));
if (start === -1) {
  console.error(`Nobody named "${after}" on the page. Found: ${cards.map((p) => p.name).join(', ')}`);
  process.exit(1);
}
const people = cards.slice(start + 1);
console.log(`Found ${cards.length} people; importing the ${people.length} after ${cards[start].name} into "${section}":`);
people.forEach((p, i) => console.log(`  ${String(i + 1).padStart(2)}. ${p.name} — ${p.role_title || '(no title)'}  [bio: ${p.bio ? p.bio.length + ' chars, ' + p.bio.split('\n\n').length + ' paragraph(s)' : 'none'}]`));

if (!apply) {
  console.log('\nDry run — nothing saved. Add --apply to save these to the database.');
  process.exit(0);
}

// ---------- write ----------
function loadEnv() {
  const env = { ...process.env };
  if (existsSync('.env.local')) {
    readFileSync('.env.local', 'utf8').split('\n').forEach((line) => {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  }
  return env;
}
const env = loadEnv();
const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!env.NEXT_PUBLIC_SUPABASE_URL || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local (run this from ~/website2).');
  process.exit(1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });

// Make sure the section exists (table may be missing on older databases).
const sec = await sb.from('team_sections').select('name, sort_order');
if (!sec.error && !(sec.data || []).some((s) => s.name.toLowerCase() === section.toLowerCase())) {
  const next = Math.max(0, ...(sec.data || []).map((s) => s.sort_order || 0)) + 1;
  const ins = await sb.from('team_sections').insert({ name: section, sort_order: next, published: true });
  if (ins.error) console.warn(`Could not add the "${section}" section (${ins.error.message}); members still get it as their section.`);
}

const { data: existing, error } = await sb.from('team_members').select('id, name, sort_order');
if (error) { console.error('Could not read team_members: ' + error.message); process.exit(1); }
let order = Math.max(0, ...existing.map((m) => m.sort_order || 0));
let added = 0, updated = 0;
for (const p of people) {
  const match = existing.find((m) => m.name.trim().toLowerCase() === p.name.toLowerCase());
  const row = { name: p.name, role_title: p.role_title || 'Ministry Leader', bio: p.bio || null, grouping: section };
  const r = match
    ? await sb.from('team_members').update(row).eq('id', match.id)
    : await sb.from('team_members').insert({ ...row, sort_order: ++order, published: true });
  if (r.error) { console.error(`  ✗ ${p.name}: ${r.error.message}`); continue; }
  if (match) updated++; else added++;
}
console.log(`\nDone: ${added} added, ${updated} updated. Check them in Admin → Team (add photos there).`);
