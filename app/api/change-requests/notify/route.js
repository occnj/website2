import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { notifyApprovers } from '@/lib/changeRequests';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Emails the approvers about change requests they have not been told about yet.
// Called by the Admin panel / Visual Editor right after an editor's change was
// held for approval. The caller must be a signed-in, active staff member; the
// request body is ignored — what gets emailed comes only from the database.
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || 'Oasis Website <noreply@hub.oasisnj.net>';

// Links in the email must point at the real site. This is deliberately taken
// from server configuration and never from the incoming request's Host header
// (which the caller controls).
function siteBase() {
  return String(process.env.CHANGE_REVIEW_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
}

async function send({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export async function POST(request) {
  try {
    const sb = getSupabaseAdminClient();
    if (!sb) return NextResponse.json({ ok: false, reason: 'server_not_configured' }, { status: 503 });

    const jwt = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!jwt) return NextResponse.json({ ok: false, reason: 'not_signed_in' }, { status: 401 });
    const { data: auth, error: authError } = await sb.auth.getUser(jwt);
    const user = auth && auth.user;
    if (authError || !user) return NextResponse.json({ ok: false, reason: 'not_signed_in' }, { status: 401 });
    const { data: profile } = await sb.from('profiles').select('active').eq('id', user.id).maybeSingle();
    if (!profile || !profile.active) return NextResponse.json({ ok: false, reason: 'not_staff' }, { status: 403 });

    const base = siteBase();
    if (!RESEND_API_KEY || !/^https?:\/\//.test(base)) {
      console.error('Change approval: RESEND_API_KEY or NEXT_PUBLIC_SITE_URL is not configured; approvers were not emailed.');
      return NextResponse.json({ ok: false, reason: 'email_not_configured' }, { status: 503 });
    }

    const result = await notifyApprovers({
      sb, send,
      newToken: () => randomBytes(32).toString('base64url'),
      reviewUrl: (token) => `${base}/review?t=${token}`,
      adminUrl: `${base}/admin`,
    });
    if (result.status === 'no_recipients') console.error('Change approval: no approver emails are set (Admin → Settings).');
    return NextResponse.json({ ok: result.status !== 'no_recipients', reason: result.status, count: result.count });
  } catch (e) {
    console.error('Change approval notify error:', e);
    return NextResponse.json({ ok: false, reason: 'send_failed' }, { status: 502 });
  }
}
