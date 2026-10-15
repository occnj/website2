import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { getMinistryBySlug, getMinistryPosts, getPageHero } from '@/lib/data';
import '../ministries/ministries.css';

// Mission Blog. Posts are the "missions" ministry's posts, managed in
// Admin → Mission Blog (same editor as the other ministry blogs).
export const metadata = {
  title: 'Mission Blog — Oasis Christian Centre',
  description: 'Stories, updates and prayer needs from the missionary partners and teams of Oasis Christian Centre — in Rahway and around the world.',
};
export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function excerpt(body, max = 160) {
  if (!body) return '';
  const plain = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > max ? plain.slice(0, max).replace(/\s+\S*$/, '') + '…' : plain;
}

export default async function MissionsPage() {
  const [ministry, hero] = await Promise.all([getMinistryBySlug('missions'), getPageHero('missions')]);
  const posts = ministry ? await getMinistryPosts(ministry.id) : [];

  return (
    <>
      <PageHero
        eyebrow="Missions"
        title={(hero && hero.title) || 'We are a sending church.'}
        description={(hero && hero.intro) || 'The Great Commission isn’t a suggestion — it’s our mandate. Oasis actively supports missionary partners around the world and mobilizes our congregation to serve both locally in Rahway and globally.'}
        image={(hero && hero.image) || (ministry && ministry.image_url) || null}
        overlayColor={(ministry && ministry.overlay_color) || null}
      />

      <section className="section" id="stories" data-screen-label="Mission Blog">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
            <div>
              <p className="t-eyebrow">Mission Blog</p>
              <h2 className="t-h2 mt-1">Stories from the field</h2>
            </div>
            <Link href="/about#missions" className="btn btn-secondary btn-sm">Our Mission Heart</Link>
          </div>

          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--sp-7) 0', color: 'var(--gray-1)' }}>
              <p style={{ fontSize: '1rem' }}>Mission stories are on their way — check back soon!</p>
            </div>
          ) : (
            <div className="ministry-posts-grid">
              {posts.map((post) => (
                <Link href={`/missions/${post.slug || post.id}`} className="post-card" key={post.id}>
                  <div className="post-card-img">
                    {post.image_url ? (
                      <img src={post.image_url} alt={post.title} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', minHeight: 160, background: 'var(--charcoal)', opacity: .15 }}></div>
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

      <section style={{ background: 'var(--charcoal)', padding: 'var(--sp-6) 0' }} data-screen-label="Mission CTA">
        <div className="container text-center">
          <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>Join the Mission</p>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: '#fff', margin: 'var(--sp-2) 0' }}>
            Pray. Give. Go.
          </h2>
          <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '1rem', maxWidth: 520, margin: '0 auto var(--sp-4)', lineHeight: 1.65 }}>
            Every story here was made possible by people who prayed, gave and served. There&rsquo;s a place for you in what God is doing next.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/serve" className="btn btn-amber">Serve With Us</Link>
            <Link href="/contact" className="btn btn-ghost">Talk to Someone</Link>
          </div>
        </div>
      </section>
    </>
  );
}
