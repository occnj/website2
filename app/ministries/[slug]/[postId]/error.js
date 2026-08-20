'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// Route-level error boundary. Prevents a single post from white-screening the
// whole site if a server-side render error occurs, and logs the real error to
// the browser console so the underlying digest/cause is discoverable.
export default function PostError({ error, reset }) {
  useEffect(() => {
    console.error('[ministry-post] render error:', error);
  }, [error]);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640, textAlign: 'center', padding: 'var(--sp-7) 0' }}>
        <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>Something went wrong</p>
        <h1 className="t-h1 mt-2">This post couldn&rsquo;t be loaded</h1>
        <p className="t-body t-muted mt-3">
          There was a problem displaying this post. Please try again — if it keeps happening, let us know.
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center', flexWrap: 'wrap', marginTop: 'var(--sp-4)' }}>
          <button className="btn btn-primary" onClick={() => reset()}>Try again</button>
          <Link href="/ministries" className="btn btn-secondary">All Ministries</Link>
        </div>
      </div>
    </section>
  );
}
