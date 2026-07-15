import Link from 'next/link';
import './leadership.css';
import PageHero from '@/components/PageHero';
import { getPageHero, getTeamMembers } from '@/lib/data';

export const metadata = {
  title: 'Leadership — Oasis Christian Centre',
  description: 'Meet the pastoral team and leaders of Oasis Christian Centre in Rahway, NJ.',
};
export const dynamic = 'force-dynamic';

export default async function LeadershipPage() {
  const [hero, team] = await Promise.all([getPageHero('leadership'), getTeamMembers()]);

  return (
    <>
      <PageHero
        eyebrow="Our Team"
        title={(hero && hero.title) || 'Leadership'}
        description={(hero && hero.intro) || 'Oasis is led by people who love God, love people, and are committed to serving the Rahway community with integrity and joy.'}
        image={hero && hero.image}
      />

      <section className="section bg-off" data-screen-label="Leadership Team">
        <div className="container">
          <div className="leader-grid" data-team-list>
            {team.length === 0 && (
              <p style={{ gridColumn: '1/-1', color: 'var(--gray-1)', textAlign: 'center', padding: '60px 0' }}>
                Our leadership team page is being updated. Check back soon!
              </p>
            )}
            {team.map((t) => {
              const links = t.links || {};
              const initials = (t.name || '').split(' ').map((w) => w[0]).slice(0, 2).join('');
              return (
                <div className="leader-card" key={t.id}>
                  <div className="leader-photo">
                    {t.photo_url ? (
                      <img src={t.photo_url} alt={t.name} />
                    ) : (
                      <div className="img-placeholder" style={{ height: '100%', minHeight: 280 }}>
                        <span style={{ fontFamily: 'var(--font-head)', fontSize: '2.4rem', color: '#9BABB6' }}>{initials}</span>
                      </div>
                    )}
                    <div className="leader-photo-overlay"></div>
                  </div>
                  <div className="leader-info">
                    <div className="leader-name">{t.name}</div>
                    <div className="leader-role">{t.role_title}</div>
                    {t.bio ? <p className="leader-bio">{t.bio}</p> : null}
                    {(links.instagram || links.facebook || links.email) && (
                      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: '.8rem', fontWeight: 600 }}>
                        {links.instagram ? <a href={links.instagram} target="_blank" rel="noopener">Instagram</a> : null}
                        {links.facebook ? <a href={links.facebook} target="_blank" rel="noopener">Facebook</a> : null}
                        {links.email ? <a href={`mailto:${links.email}`}>Email</a> : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section bg-charcoal" data-screen-label="Join the Team CTA">
        <div className="container text-center">
          <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>Get Involved</p>
          <h2 className="t-h2 text-white mt-2" style={{ marginBottom: 'var(--sp-2)' }}>Interested in serving?</h2>
          <p style={{ color: 'rgba(255,255,255,.65)', maxWidth: 460, margin: '0 auto var(--sp-4)', fontSize: '.95rem', lineHeight: 1.7 }}>
            Every team at Oasis is led by someone who started where you are. If you feel called to serve, we&rsquo;d love to connect with you.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/about#ministries" className="btn btn-primary">Explore Teams</Link>
            <Link href="/contact" className="btn btn-ghost">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
