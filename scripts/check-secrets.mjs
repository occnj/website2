import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const patterns = [
  ['Resend API key', new RegExp('re_' + '[A-Za-z0-9]{24,}', 'g')],
  ['GitHub token', new RegExp('(ghp_|github_pat_)' + '[A-Za-z0-9_]{20,}', 'g')],
  ['OpenAI key', new RegExp('sk-' + '[A-Za-z0-9_-]{20,}', 'g')],
  ['Stripe secret key', new RegExp('sk_(live|test)_' + '[A-Za-z0-9]{16,}', 'g')],
  ['AWS access key', new RegExp('AKIA' + '[0-9A-Z]{16}', 'g')],
  ['JWT', new RegExp('eyJ' + '[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,}', 'g')],
  ['Private key', new RegExp('BEGIN (RSA |EC |OPENSSH )?' + 'PRIVATE KEY', 'g')],
];

const allowed = new Set(['.env.example', 'scripts/check-secrets.mjs']);
const findings = [];
for (const file of tracked) {
  if (allowed.has(file)) continue;
  let content;
  try { content = readFileSync(file, 'utf8'); } catch { continue; }
  if (content.includes('\0')) continue;
  for (const [name, pattern] of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) findings.push(`${file}: possible ${name}`);
  }
}

if (findings.length) {
  console.error('Potential credentials found in tracked files:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}
console.log(`Secret scan passed (${tracked.length} tracked files checked).`);
