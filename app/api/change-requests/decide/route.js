import { getSupabaseAdminClient } from '@/lib/supabase';
import { decideByToken } from '@/lib/changeRequests';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Approve or reject a change from the page an email link opens (app/review).
// Only a POST from that page's buttons changes anything — opening the link
// (GET) never does, so email scanners and link previews cannot approve.
// The personal link token is the credential; it stops working once used.
// ---------------------------------------------------------------------------

function back(params) {
  // Relative redirect: correct behind the proxy regardless of internal host/port.
  return new Response(null, { status: 303, headers: { Location: '/review?' + new URLSearchParams(params).toString(), 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  let token = '';
  try {
    const form = await request.formData();
    token = String(form.get('t') || '');
    const action = String(form.get('action') || '');
    const sb = getSupabaseAdminClient();
    if (!sb) return back({ done: 'error' });

    const result = await decideByToken({
      sb, token,
      action: action === 'approve' || action === 'approve-anyway' ? 'approve' : action,
      force: action === 'approve-anyway',
      note: String(form.get('note') || ''),
    });
    if (result.status === 'conflict') return back({ t: token, conflict: result.conflict });
    if (result.status === 'decided') return back({ done: 'already', was: result.request.status });
    return back({ done: result.status });
  } catch (e) {
    console.error('Change approval decide error:', e);
    return token ? back({ t: token, conflict: 'error' }) : back({ done: 'error' });
  }
}
