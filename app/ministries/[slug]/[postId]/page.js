import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMinistryPost } from '@/lib/data';
import '../../ministries.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const post = await getMinistryPost(params.postId);
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
  const post = await getMinistryPost(params.postId);
  if (!post) notFound();

  const ministry = post.ministries || {};
  const color = ministry.color || 'var(--blue)';

  return (
    <section className="section">
      <div className="container">
        <article className="post-article">
          <Link href={`/ministries/${ministry.slug || params.slug}`} className="post-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back to {ministry.name || 'Ministry'}
          </Link>

          <div style={{ marginBottom: 'var(--sp-3)' }}>
            <span className="ministry-accent" style={{ background: color }}></span>
            <p className="t-eyebrow" style={{ color }}>{ministry.name}</p>
            <h1 className="t-h1 mt-2">{post.title}</h1>
            {post.published_at && (
              <p style={{ fontSize: '.82rem', color: 'var(--gray-1)', marginTop: 8, fontWeight: 600, letterSpacing: '.03em' }}>
                {fmtDate(post.published_at)}
              </p>
            )}
          </div>

          {post.image_url && (
            <img src={post.image_url} alt={post.title} className="post-article-img" />
          )}

          {post.body ? (
            <div
              className="post-article-body"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          ) : (
            <p style={{ color: 'var(--gray-1)' }}>No content yet.</p>
          )}

          <div style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--border)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <Link href={`/ministries/${ministry.slug || params.slug}`} className="btn btn-secondary">
              ← More from {ministry.name}
            </Link>
            <Link href="/contact" className="btn btn-primary">Get Involved</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
