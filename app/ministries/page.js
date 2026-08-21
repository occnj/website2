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
            <div className="ministry-cards-grid">
              {ministries.map((m) => {
                const overlay = m.overlay_color || '#1A2835';
                return (
                  <Link
                    key={m.id}
                    href={`/ministries/${m.slug}`}
                    className="ministry-card-overlay"
                    style={!m.image_url ? { background: overlay } : undefined}
                  >
                    {m.image_url && (
                      <img className="ministry-card-bg" src={m.image_url} alt={m.name} />
                    )}
                    <div
                      className="ministry-card-gradient"
                      style={{
                        background: `linear-gradient(to top, ${overlay}ee 0%, ${overlay}88 45%, ${overlay}22 100%)`,
                      }}
                    />
                    <div className="ministry-card-body">
                      <p className="ministry-card-name">{m.name}</p>
                      <span className="ministry-card-cta">Blog &amp; Updates →</span>
                    </div>
                  </Link>
                );
              })}
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
