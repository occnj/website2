import Link from 'next/link';
import PageHero from '@/components/PageHero';
import { getPageHero, getVolunteerPositions } from '@/lib/data';
import { safeHttpUrl } from '@/lib/safeUrl';
import './serve.css';

// Serve page: open volunteer positions are managed in Admin → Serve Positions.
export const metadata = {
  title: 'Serve — Oasis Christian Centre',
  description: 'Use your gifts at Oasis Christian Centre. See open volunteer positions and how to apply.',
};
export const dynamic = 'force-dynamic';

const APPLY_URL = 'https://oasisnj.churchcenter.com/people/forms/339396';

const STEPS = [
  ['Explore', 'Find a ministry area that matches your gifts and passion.'],
  ['Apply', 'Fill out the short volunteer form — it takes a couple of minutes.'],
  ['Connect', 'A team leader reaches out, answers questions and helps you try it out.'],
  ['Serve', 'Join a team that helps people experience the love of Jesus every week.'],
];

export default async function ServePage() {
  const [hero, positions] = await Promise.all([getPageHero('serve'), getVolunteerPositions()]);

  return (
    <>
      <PageHero
        eyebrow="Serve"
        title={(hero && hero.title) || 'Your gifts were made for this.'}
        description={(hero && hero.intro) || 'Every person at Oasis has something to offer. When you serve, you become part of the team that makes Sundays happen — and the community thrive.'}
        image={hero && hero.image}
      />

      <section className="section" id="positions" data-screen-label="Open Positions">
        <div className="container">
          <div className="serve-head">
            <div>
              <p className="t-eyebrow">Open Positions</p>
              <h2 className="t-h2 mt-1">Where we need you now</h2>
            </div>
            <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">General Volunteer Application ↗</a>
          </div>

          {positions.length === 0 ? (
            <div className="position-card position-card-general">
              <div className="position-team">Any Team</div>
              <h3>Not sure where you fit?</h3>
              <p>Tell us a little about yourself and we&rsquo;ll help you find the right place to start serving.</p>
              <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">How to Apply</a>
            </div>
          ) : (
            <div className="positions-grid">
              {positions.map((p) => {
                const href = safeHttpUrl(p.apply_url) || APPLY_URL;
                return (
                  <article className="position-card" key={p.id} data-cms-scope={`position-${p.id}`}>
                    {p.team ? <div className="position-team">{p.team}</div> : null}
                    <h3>{p.title}</h3>
                    {p.description ? <p className="position-desc">{p.description}</p> : null}
                    {p.commitment ? <span className="position-commit">{p.commitment}</span> : null}
                    <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">{p.apply_label || 'How to Apply'}</a>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section bg-off" data-screen-label="How It Works">
        <div className="container">
          <p className="t-eyebrow">How It Works</p>
          <h2 className="t-h2 mt-1">A healthy path into serving</h2>
          <div className="serve-steps">
            {STEPS.map(([title, text], i) => (
              <div className="serve-step" key={title}>
                <span className="serve-step-num">{String(i + 1).padStart(2, '0')}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--blue)', padding: 'var(--section-y) 0' }} data-screen-label="Serve CTA">
        <div className="container text-center">
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: '#fff', marginBottom: 'var(--sp-2)' }}>
            Have a question first?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '1rem', maxWidth: 420, margin: '0 auto var(--sp-3)', lineHeight: 1.65 }}>
            We&rsquo;d love to help you find your place on the team.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn btn-ghost btn-lg">Talk to Someone</Link>
            <Link href="/about#ministries" className="btn btn-ghost btn-lg">See Our Ministries</Link>
          </div>
        </div>
      </section>
    </>
  );
}
