import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/PageHero';
import { getMinistryBySlug, getMinistryPosts } from '@/lib/data';
import '../ministries.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const ministry = await getMinistryBySlug(params.slug);
  if (!ministry) return {};
  return {
    title: `${ministry.name} — Oasis Christian Centre`,
    description: ministry.description || '',
  };
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function excerpt(body, max = 160) {
  if (!body) return '';
  const plain = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > max ? plain.slice(0, max).replace(/\s+\S*$/, '') + '…' : plain;
}

export default async function MinistryPage({ params }) {
  const ministry = await getMinistryBySlug(params.slug);
  if (!ministry) notFound();

  const posts = await getMinistryPosts(ministry.id);

  const color = ministry.color || 'var(--blue)';

  return (
    <>
      <PageHero
        eyebrow="Ministry"
        title={ministry.name}
        description={ministry.description || ''}
        image={ministry.image_url || null}
        overlayColor={ministry.overlay_color || null}
      />

      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
            <div>
              <span className="ministry-accent" style={{ background: color }}></span>
              <h2 className="t-h2">Latest from {ministry.name}</h2>
            </div>
            <Link href="/about#ministries" className="btn btn-secondary btn-sm">← All Ministries</Link>
          </div>

          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--sp-7) 0', color: 'var(--gray-1)' }}>
              <p style={{ fontSize: '1rem' }}>No posts yet — check back soon!</p>
            </div>
          ) : (
            <div className="ministry-posts-grid">
              {posts.map((post) => (
                <Link href={`/ministries/${ministry.slug}/${post.slug || post.id}`} className="post-card" key={post.id}>
                  <div className="post-card-img">
                    {post.image_url ? (
                      <img src={post.image_url} alt={post.title} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', minHeight: 160, background: color, opacity: .15 }}></div>
                    )}
                  </div>
                  <div className="post-card-body">
                    <div className="post-card-date">{fmtDate(post.published_at)}</div>
                    <div className="post-card-title">{post.title}</div>
                    <div className="post-card-excerpt">{excerpt(post.body)}</div>
                    <div className="post-card-read">Read more →</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: 'var(--blue)', padding: 'var(--sp-6) 0' }}>
        <div className="container text-center">
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: '#fff', marginBottom: 'var(--sp-2)' }}>
            Want to get involved?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '1rem', maxWidth: 380, margin: '0 auto var(--sp-3)', lineHeight: 1.65 }}>
            We&rsquo;d love to connect you with the {ministry.name} team.
          </p>
          <Link href="/contact" className="btn btn-ghost btn-lg">Get in Touch</Link>
        </div>
      </section>
    </>
  );
}
