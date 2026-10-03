import Link from 'next/link';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { describeChange, loadByToken, TOKEN_MAX_AGE_DAYS } from '@/lib/changeRequests';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Review a website change',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

// The page an approver lands on from the "Review & approve" email link.
// Opening it changes nothing; only the buttons below (a POST) do.

const DONE = {
  approved: ['Approved', 'The change is now live on the website.'],
  rejected: ['Rejected', 'The change was not published. The person who requested it can see your note in the Admin panel.'],
  already: ['Already handled', 'This change has already been decided, so there is nothing more to do.'],
  error: ['Something went wrong', 'The decision could not be saved. Please try the link again, or use Admin → Approvals.'],
};
const CONFLICT = {
  row_changed_since: 'This item was edited by someone else after the request was made. Approving will replace those newer edits with this version.',
  row_already_exists: 'An item like this has been created since the request was made. Approving will overwrite it.',
  row_missing: 'This item has been deleted since the request was made. Approving will bring it back with these changes.',
  error: 'The decision could not be saved. Nothing was changed — please try again.',
};
const STATUS_WORDS = { approved: 'approved', rejected: 'rejected', withdrawn: 'withdrawn by the person who requested it', superseded: 'replaced by a newer request from the same person' };

function Shell({ eyebrow, title, children }) {
  return (
    <main className="section" style={{ paddingTop: 'calc(var(--header-h) + var(--sp-6))', minHeight: '70vh' }}>
      <div className="container-narrow">
        <p className="t-eyebrow">{eyebrow}</p>
        <h1 className="t-display mt-2" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', overflowWrap: 'anywhere' }}>{title}</h1>
        {children}
      </div>
    </main>
  );
}

function Lines({ desc }) {
  return (
    <div style={{ marginTop: 20, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      {desc.lines.map((l, i) => (
        <div key={i} style={{ padding: '12px 16px', borderTop: i ? '1px solid var(--border)' : 0, background: l.risky ? '#fff4e5' : undefined }}>
          <div style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--gray-1)' }}>{l.what}</div>
          {l.before ? <div style={{ color: '#a33', textDecoration: 'line-through', overflowWrap: 'anywhere' }}>{l.before}</div> : null}
          {l.after ? <div style={{ color: '#1a6b34', overflowWrap: 'anywhere' }}>{l.after}</div> : (l.before ? <div style={{ color: 'var(--gray-1)' }}>(removed)</div> : null)}
        </div>
      ))}
      {desc.extra ? <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', color: 'var(--gray-1)' }}>…and {desc.extra} more</div> : null}
    </div>
  );
}

export default async function ReviewPage({ searchParams }) {
  const q = (await searchParams) || {};
  const token = typeof q.t === 'string' ? q.t : '';
  const done = typeof q.done === 'string' ? q.done : '';
  const conflict = typeof q.conflict === 'string' ? q.conflict : '';

  if (done && DONE[done]) {
    return (
      <Shell eyebrow="Website change" title={DONE[done][0]}>
        <p className="t-body t-muted mt-3">{DONE[done][1]}</p>
        <Link href="/admin" className="btn btn-secondary mt-4">Open Admin</Link>
      </Shell>
    );
  }

  const sb = getSupabaseAdminClient();
  const found = sb && token ? await loadByToken({ sb, token }) : { status: 'invalid' };

  if (found.status === 'invalid') {
    return (
      <Shell eyebrow="Website change" title="This link is no longer active">
        <p className="t-body t-muted mt-3">The change may already have been approved or rejected, or the link was copied incompletely. You can see everything that is waiting in Admin → Approvals.</p>
        <Link href="/admin" className="btn btn-secondary mt-4">Open Admin</Link>
      </Shell>
    );
  }

  const r = found.request;
  const desc = describeChange(r);
  const when = new Date(r.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });

  if (found.status !== 'pending') {
    return (
      <Shell eyebrow="Website change" title={desc.headline}>
        <p className="t-body t-muted mt-3">
          {found.status === 'expired'
            ? `This link is more than ${TOKEN_MAX_AGE_DAYS} days old and has expired. The change is still waiting — review it in Admin → Approvals.`
            : `This change was ${STATUS_WORDS[r.status] || r.status}${r.decided_by && r.status !== 'superseded' && r.status !== 'withdrawn' ? ' by ' + r.decided_by : ''}. Nothing more to do.`}
        </p>
        <Link href="/admin" className="btn btn-secondary mt-4">Open Admin</Link>
      </Shell>
    );
  }

  const pageHref = r.table_name === 'page_overrides' && !r.pk_value.startsWith('__') ? '/' + (r.pk_value === 'index' ? '' : r.pk_value) : null;

  return (
    <Shell eyebrow="Waiting for your approval" title={desc.headline}>
      <p className="t-body t-muted mt-3">
        Requested by <strong>{r.requested_by_name || 'Unknown'}</strong>{r.requested_by_email ? ` (${r.requested_by_email})` : ''} on {when} ET.
        This is <strong>not on the website yet</strong>.
        {pageHref ? <> <a href={pageHref} target="_blank" rel="noreferrer">See the page as it is now ↗</a></> : null}
      </p>

      {desc.risky ? (
        <p role="note" style={{ marginTop: 16, padding: '10px 14px', background: '#fff4e5', borderLeft: '4px solid #e08a00', borderRadius: 6 }}>
          <strong>Look closely:</strong> {desc.reasons.join('; ')}.
        </p>
      ) : null}
      {conflict ? (
        <p role="alert" style={{ marginTop: 16, padding: '10px 14px', background: 'var(--amber-light)', borderLeft: '4px solid var(--amber)', borderRadius: 6 }}>
          {CONFLICT[conflict] || CONFLICT.error}
        </p>
      ) : null}

      <Lines desc={desc} />

      <form method="post" action="/api/change-requests/decide" style={{ marginTop: 24 }}>
        <input type="hidden" name="t" value={token} />
        <label htmlFor="review-note" className="t-body" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Note for {r.requested_by_name || 'the requester'} (optional)</label>
        <textarea id="review-note" name="note" rows={2} maxLength={500} placeholder="e.g. Please fix the date first"
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, font: 'inherit' }} />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          {conflict && conflict !== 'error'
            ? <button className="btn btn-amber" type="submit" name="action" value="approve-anyway">Approve anyway</button>
            : <button className="btn btn-primary" type="submit" name="action" value="approve">Approve &amp; publish</button>}
          <button className="btn btn-secondary" type="submit" name="action" value="reject">Reject</button>
        </div>
        <p className="t-muted" style={{ fontSize: '.8rem', marginTop: 14 }}>
          Signed in to this link as {found.recipient}. Your decision is recorded under that address.
        </p>
      </form>
    </Shell>
  );
}
