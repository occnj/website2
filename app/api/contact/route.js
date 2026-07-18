import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Email routing via Resend.
//   - Prayer requests  -> site_settings.prayer_recipients
//   - Everything else  -> site_settings.form_recipients
// The API key and from-address come from env (RESEND_API_KEY, RESEND_FROM);
// fallbacks are provided so it works if env isn't wired yet.
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_ZCuopxc6_NC3GisHSNXWKjH4w8gHhcxh9';
const FROM = process.env.RESEND_FROM || 'Oasis Website <noreply@hub.oasisnj.net>';

const DEFAULT_PRAYER_RECIPIENTS = ['oasis@oasisnj.net', 'PHegel@oasisnj.net', 'pjhegel@verizon.net'];
const DEFAULT_FORM_RECIPIENTS = ['oasis@oasisnj.net'];

function parseRecipients(value, fallback) {
  const recipients = String(value || '')
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  return recipients.length ? [...new Set(recipients)] : fallback;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
    const body = await request.json();
    const { formType, name, email, phone, ...rest } = body;

    // Honeypot: bots fill hidden "company" field
    if (body.company) return NextResponse.json({ ok: true });

    if (!name || (!email && !phone)) {
      return NextResponse.json({ ok: false, error: 'Name and a contact method are required.' }, { status: 400 });
    }

    const isPrayer = formType === 'prayer' || rest.reason === 'Prayer Request';
    const settings = await getSiteSettings();
    const to = isPrayer
      ? parseRecipients(settings && settings.prayer_recipients, DEFAULT_PRAYER_RECIPIENTS)
      : parseRecipients(settings && settings.form_recipients, DEFAULT_FORM_RECIPIENTS);
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
