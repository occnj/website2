import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
const core = readFileSync(new URL('../public/cms-core.js', import.meta.url), 'utf8');
const routes = ['index','about','ministries','plan-your-visit','watch','events','contact','prayer','give','life-events','leadership'];
let total = 0;
for (const route of routes) {
  const html = readFileSync(`/tmp/oasis-${route}.html`, 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  dom.window.eval(core);
  const targets = dom.window.OASIS.copyTargets();
  const keys = targets.map(t => t.key);
  if (new Set(keys).size !== keys.length) throw new Error(`${route}: duplicate text keys`);
  const edits = { copy: Object.fromEntries(targets.map(t => [t.key, t.get() + ', audit.'])) };
  const fresh = new JSDOM(html, { runScripts: 'outside-only' });
  fresh.window.eval(core);
  fresh.window.OASIS.applyEdits(edits);
  for (const target of fresh.window.OASIS.copyTargets()) {
    if (target.get() !== edits.copy[target.key]) throw new Error(`${route}: failed round trip: ${target.key}`);
  }
  total += targets.length;
  console.log(`${route}: ${targets.length} text/attribute edits round-tripped`);
  dom.window.close(); fresh.window.close();
}
console.log(`PASS: ${total} targets across ${routes.length} routes`);
