import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMinistryBySlug, getMinistryPostBySlug } from '@/lib/data';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import '../../ministries.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const ministry = await getMinistryBySlug(params.slug);
  if (!ministry) return {};
  const post = await getMinistryPostBySlug(ministry.id, params.postId);
  if (!post) return {};
  return {
    title: `${post.title} — Oasis Christian Centre`,
    description: post.body ? post.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 155) + '…' : '',
  };
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default async function MinistryPostPage({ params }) {
  // params.slug is the ministry slug (from the URL) — always reliable.
  // params.postId is either a slug or a UUID (backward-compat).
  const ministry = await getMinistryBySlug(params.slug);
  if (!ministry) notFound();

  const post = await getMinistryPostBySlug(ministry.id, params.postId);
  if (!post) notFound();

  const color = ministry.color || 'var(--blue)';
  const safeBody = post.body ? await sanitizeHtml(post.body) : '';

  return (
    <>
      {/* Hero band — gives the floating header an image to sit over and makes
          the post read well on mobile. Falls back to the ministry colour when
          the post has no image. */}
      <section
        className={'post-hero' + (post.image_url ? ' has-img' : '')}
        style={!post.image_url ? { background: color } : undefined}
      >
        {post.image_url && (
          <div className="post-hero-bg">
            <img src={post.image_url} alt={post.title} />
            <div className="post-hero-overlay" />
          </div>
        )}
        <div className="container">
          <span className="ministry-accent" style={{ background: post.image_url ? '#fff' : 'rgba(255,255,255,.85)' }}></span>
          <p className="t-eyebrow post-hero-eyebrow">{ministry.name}</p>
          <h1 className="t-h1 text-white mt-2">{post.title}</h1>
          {post.published_at && (
            <p className="post-hero-date">{fmtDate(post.published_at)}</p>
          )}
        </div>
      </section>

    <section className="section">
      <div className="container">
        <article className="post-article">
          {/* Use params.slug — the URL segment — not the joined ministry object,
              which could be null if the FK join didn't resolve. */}
          <Link href={`/ministries/${params.slug}`} className="post-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back to {ministry.name}
          </Link>

          {safeBody ? (
            <div className="post-article-body" dangerouslySetInnerHTML={{ __html: safeBody }} />
          ) : (
            <p style={{ color: 'var(--gray-1)' }}>No content yet.</p>
          )}

          <div style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <Link href={`/ministries/${params.slug}`} className="btn btn-secondary">
              ← More from {ministry.name}
            </Link>
            <Link href="/contact" className="btn btn-primary">Get Involved</Link>
          </div>
        </article>
      </div>
    </section>
    </>
  );
}
