import { NextResponse } from 'next/server';
import { getFormSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Email routing via Resend.
//   - Prayer requests  -> private form_settings.prayer_recipients
//   - Everything else  -> private form_settings.form_recipients
// The API key and from-address come from env (RESEND_API_KEY, RESEND_FROM).
// Secrets are never embedded in source code.
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || 'Oasis Website <noreply@hub.oasisnj.net>';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const attempts = globalThis.__oasisFormAttempts || new Map();
globalThis.__oasisFormAttempts = attempts;

function parseRecipients(value) {
  const recipients = String(value || '')
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  return [...new Set(recipients)];
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clientIp(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    request.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  if (attempts.size > 5000) attempts.delete(attempts.keys().next().value);
  const recent = (attempts.get(ip) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

function buildHtml(fields) {
  const rows = Object.entries(fields)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#12202c;vertical-align:top;white-space:nowrap">${esc(
          k
        )}</td><td style="padding:6px 12px;color:#333">${esc(v).replace(/\n/g, '<br>')}</td></tr>`
    )
    .join('');
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:600px">
    <table style="border-collapse:collapse;width:100%;background:#f9f8f6;border-radius:8px;overflow:hidden">${rows}</table>
  </div>`;
}

export async function POST(request) {
  try {
    const contentLength = Number(request.headers.get('content-length')) || 0;
    if (contentLength > 64 * 1024) return NextResponse.json({ ok: false, error: 'Request is too large.' }, { status: 413 });
    if (isRateLimited(clientIp(request))) {
      return NextResponse.json({ ok: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const body = await request.json();
    // Honeypot: bots fill hidden "company" field
    if (body.company) return NextResponse.json({ ok: true });
    if (!RESEND_API_KEY) {
      console.error('Contact route error: RESEND_API_KEY is not configured');
      return NextResponse.json({ ok: false, error: 'Email service is not configured.' }, { status: 503 });
    }
    const { formType, ...raw } = body;
    const name = clean(raw.name, 120);
    const email = clean(raw.email, 254);
    const phone = clean(raw.phone, 40);
    delete raw.name; delete raw.email; delete raw.phone; delete raw.company;
    const rest = Object.fromEntries(Object.entries(raw).slice(0, 20).map(([key, value]) => [clean(key, 80), clean(value, 5000)]));

    const isPrayer = formType === 'prayer' || rest.reason === 'Prayer Request';
    if (!name || (!isPrayer && !email && !phone)) {
      return NextResponse.json({ ok: false, error: 'Name and a contact method are required.' }, { status: 400 });
    }

    if (isPrayer && !rest['Prayer Request']) {
      return NextResponse.json({ ok: false, error: 'A prayer request is required.' }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!isPrayer && !rest.message && formType !== 'life-event') {
      return NextResponse.json({ ok: false, error: 'A message is required.' }, { status: 400 });
    }

    const settings = await getFormSettings();
    const to = isPrayer
      ? parseRecipients(settings && settings.prayer_recipients)
      : parseRecipients(settings && settings.form_recipients);
    if (!to.length) {
      console.error('Contact route error: no recipients configured for', formType);
      return NextResponse.json({ ok: false, error: 'Form delivery is not configured.' }, { status: 503 });
    }
    const subjectPrefix = isPrayer ? 'Prayer Request' : 'Website Form';
    const subject = `${subjectPrefix} — ${name}`;

    // Assemble a clean field list for the email body
    const fields = {
      Name: name,
      Email: email,
      Phone: phone,
      ...rest,
      Submitted: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET',
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to,
        reply_to: email || undefined,
        subject,
        html: buildHtml(fields),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Resend error:', res.status, detail);
      return NextResponse.json({ ok: false, error: 'Email service error.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Contact route error:', e);
    return NextResponse.json({ ok: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
