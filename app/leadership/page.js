import Link from 'next/link';
import './leadership.css';
import PageHero from '@/components/PageHero';
import TeamSections, { buildTeamGroups } from '@/components/TeamSections';
import { getPageHero, getTeamMembers, getTeamSections } from '@/lib/data';

export const metadata = {
  title: 'Leadership — Oasis Christian Centre',
  description: 'Meet the pastoral team and leaders of Oasis Christian Centre in Rahway, NJ.',
};
export const dynamic = 'force-dynamic';

export default async function LeadershipPage() {
  const [hero, team, sections] = await Promise.all([getPageHero('leadership'), getTeamMembers(), getTeamSections()]);
  const groups = buildTeamGroups(team, sections);

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
          {team.length === 0 ? (
            <p style={{ color: 'var(--gray-1)', textAlign: 'center', padding: '60px 0' }}>
              Our leadership team page is being updated. Check back soon!
            </p>
          ) : <TeamSections groups={groups} />}
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
            <Link href="/about#ministries" className="btn btn-primary">Explore Ministries</Link>
            <Link href="/contact" className="btn btn-ghost">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
