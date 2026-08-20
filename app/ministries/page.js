import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { getPageHero, getMinistries } from '@/lib/data';
import './ministries.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ministries — Oasis Christian Centre',
  description: 'Explore the ministries of Oasis Christian Centre in Rahway, NJ — from women and men to youth, kids, recovery, and missions.',
};

export default async function MinistriesPage() {
  const [hero, ministries] = await Promise.all([
    getPageHero('ministries'),
    getMinistries(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Get Involved"
        title={hero?.title || 'Our Ministries'}
        description={hero?.description || 'Something for everyone. Find your community at Oasis.'}
        image={hero?.image_url || null}
      />

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: 600, margin: '0 auto var(--sp-6)', textAlign: 'center' }}>
            <p className="t-body t-muted">
              Each ministry at Oasis is a community within the community — a place to grow, serve, and belong.
            </p>
          </div>

          {ministries.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gray-1)', padding: 'var(--sp-6) 0' }}>
              Ministry pages coming soon — check back shortly.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-4)' }}>
              {ministries.map((m) => (
                <Link
                  key={m.id}
                  href={`/ministries/${m.slug}`}
                  className="ministry-card"
                  style={{ borderTop: `4px solid ${m.color || 'var(--blue)'}`, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', transition: 'box-shadow .18s, transform .18s' }}
                >
                  {m.image_url && (
                    <div style={{ margin: 'calc(var(--sp-4) * -1) calc(var(--sp-4) * -1) 0', aspectRatio: '16/7', overflow: 'hidden' }}>
                      <img src={m.image_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="ministry-card-top" style={{ marginTop: m.image_url ? 'var(--sp-3)' : 0 }}>
                    <span className="ministry-card-dot" style={{ background: m.color || 'var(--blue)' }}></span>
                    <span className="ministry-card-name">{m.name}</span>
                  </div>
                  {m.description && <p className="ministry-card-desc">{m.description}</p>}
                  <span style={{ marginTop: 'auto', fontSize: '.8rem', fontWeight: 700, color: m.color || 'var(--blue)' }}>
                    Blog & Updates →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: 'var(--off-white)', padding: 'var(--sp-6) 0', borderTop: '1px solid var(--border)' }}>
        <div className="container text-center">
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
            Not sure where to start?
          </h2>
          <p style={{ color: 'var(--gray-1)', maxWidth: 380, margin: '0 auto var(--sp-3)', lineHeight: 1.65 }}>
            Come visit us on a Sunday and we&apos;ll help you find your fit.
          </p>
          <Link href="/plan-your-visit" className="btn btn-primary">Plan Your Visit</Link>
        </div>
      </section>
    </>
  );
}
