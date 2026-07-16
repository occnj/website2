import Link from 'next/link';
import './plan-your-visit.css';
import PageHero from '@/components/PageHero';
import FaqAccordion from '@/components/FaqAccordion';
import { getPageHero } from '@/lib/data';

export const metadata = {
  title: 'Plan Your Visit — Oasis Christian Centre',
  description: 'Everything you need to know before your first visit to Oasis Christian Centre in Rahway, NJ.',
};
export const dynamic = 'force-dynamic';

const VISIT_FAQS = [
  { q: 'What should I wear?', a: "Come as you are, seriously. You'll see everything from jeans to business casual. We care far more about you being here than what you're wearing." },
  { q: 'Is there parking?', a: 'Yes — free parking is available in our lot directly adjacent to the building. Street parking is also available on nearby roads. Look for our signage to guide you in.' },
  { q: 'How long is the service?', a: 'Our Sunday services typically run about 75 minutes. You can expect worship music, announcements, and a message. We try to end on time so you can plan your day.' },
  { q: 'Do I need to give money?', a: "Not at all. Giving is a personal act of worship for our members. As a first-time guest, please don't feel any pressure — just enjoy the service." },
  { q: 'Is Oasis welcoming to everyone?', a: 'Absolutely. No matter your background, story, or season of life — you are welcome at Oasis. We believe every person matters and everyone belongs.' },
  { q: 'What if I have more questions?', a: <>We&rsquo;d love to hear from you. Reach out via our <Link href="/contact" style={{ color: 'var(--blue)' }}>contact page</Link> or just show up Sunday and ask one of our welcome team members in person — they&rsquo;re the ones with the big smiles.</> },
];

export default async function PlanYourVisitPage() {
  const hero = await getPageHero('plan-your-visit');

  return (
    <>
      <PageHero
        eyebrow="First Time?"
        title={(hero && hero.title) || 'Plan Your Visit'}
        description={(hero && hero.intro) || "We've thought through the details so you don't have to. Here's everything you need for a great first Sunday."}
        image={hero && hero.image}
      >
        <div style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <a href="https://maps.google.com/?q=Oasis+Christian+Centre+Rahway+NJ" target="_blank" rel="noopener" className="btn btn-primary">Get Directions →</a>
          <a href="#what-to-expect" className="btn btn-ghost">What to Expect ↓</a>
        </div>
      </PageHero>

      <section className="section" id="what-to-expect" data-screen-label="What to Expect">
        <div className="container">
          <div className="split-2" style={{ gap: 'var(--sp-7)' }}>
            <div>
              <p className="t-eyebrow">Your First Sunday</p>
              <h2 className="t-h1 mt-2">Here&rsquo;s what happens<br />when you arrive.</h2>
              <p className="t-body t-muted mt-3">No dress code. No pressure. Just a warm welcome from real people who are genuinely glad you&rsquo;re here.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
                {[
                  ['1', 'Park & Walk In', 'Free parking is available in our lot and on the surrounding streets. Look for the Oasis signs — we’re easy to spot.'],
                  ['2', 'Meet Our Welcome Team', 'Friendly faces at the door will greet you, answer any questions, and point you in the right direction.'],
                  ['3', 'Check In Your Kids', 'Our secure, fun check-in system means your children are safe and enjoying an age-appropriate experience while you worship.'],
                  ['4', 'Find a Seat & Settle In', 'Grab a coffee and find a seat. Our service runs about 75 minutes and includes worship, prayer, and a practical message.'],
                ].map(([num, title, desc]) => (
                  <div className="visit-step" key={num}>
                    <div className="visit-step-num">{num}</div>
                    <div className="visit-step-content">
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="img-placeholder" style={{ aspectRatio: '4/5', borderRadius: 'var(--radius-lg)', minHeight: 480 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="6" y="6" width="36" height="36" rx="4" stroke="#9BABB6" strokeWidth="1.5" /><circle cx="18" cy="18" r="6" stroke="#9BABB6" strokeWidth="1.5" /><path d="M8 42c0-8 4-14 10-14M22 42c2-6 6-11 14-14" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>Welcome team / lobby<br />Warm, inviting entrance photo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-off" data-screen-label="Service Experience">
        <div className="container">
          <div className="text-center" style={{ maxWidth: 600, margin: '0 auto var(--sp-6)' }}>
            <p className="t-eyebrow">The Experience</p>
            <h2 className="t-h1 mt-2">What our services are like</h2>
            <p className="t-body t-muted mt-3">Expect about 75 minutes of worship, community, and a message that&rsquo;s honest, relevant, and grounded in Scripture.</p>
          </div>
          <div className="grid-3">
            <div style={{ textAlign: 'center', padding: 'var(--sp-4)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--blue-light)', display: 'grid', placeItems: 'center', margin: '0 auto var(--sp-3)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
              </div>
              <h3 className="t-h3">Contemporary Worship</h3>
              <p className="t-small t-muted mt-2">Live music that&rsquo;s modern, Spirit-led, and deeply worshipful. Come ready to sing — or just to listen.</p>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--sp-4)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--amber-light)', display: 'grid', placeItems: 'center', margin: '0 auto var(--sp-3)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
              </div>
              <h3 className="t-h3">Relevant Teaching</h3>
              <p className="t-small t-muted mt-2">Messages rooted in the Bible and applied to real life — honest, clear, and full of hope.</p>
            </div>
            <div style={{ textAlign: 'center', padding: 'var(--sp-4)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: '#EDF7F0', display: 'grid', placeItems: 'center', margin: '0 auto var(--sp-3)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4A8C6A" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <h3 className="t-h3">Welcoming Community</h3>
              <p className="t-small t-muted mt-2">You&rsquo;ll never feel like a stranger for long. Oasis is full of real, warm people who are excited to meet you.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" data-screen-label="Kids & Family">
        <div className="container">
          <div className="split-2">
            <div>
              <div className="img-placeholder" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)' }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="16" r="8" stroke="#9BABB6" strokeWidth="1.5" /><path d="M10 40c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /><circle cx="12" cy="20" r="4" stroke="#9BABB6" strokeWidth="1.5" /><circle cx="36" cy="20" r="4" stroke="#9BABB6" strokeWidth="1.5" /></svg>
                <span>Kids ministry photo<br />Fun, safe, age-appropriate</span>
              </div>
            </div>
            <div>
              <p className="t-eyebrow">For Families</p>
              <h2 className="t-h1 mt-2">Your kids will<br />love it here.</h2>
              <p className="t-body t-muted mt-3">We have safe, fun, age-appropriate environments for every child — from nursery through high school. Parents worship freely knowing their kids are in great hands.</p>
              <div style={{ marginTop: 'var(--sp-4)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['Nursery', 'Pre-K', 'Elementary', 'Middle School', 'High School'].map((c) => (
                  <span className="ministry-chip" key={c}>{c}</span>
                ))}
              </div>
              <p className="t-small t-muted mt-3">All children&rsquo;s workers are background-checked. Secure check-in with name tags ensures your child&rsquo;s safety throughout the service.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-off" data-screen-label="FAQ">
        <div className="container-narrow">
          <p className="t-eyebrow text-center">FAQ</p>
          <h2 className="t-h2 text-center mt-2" style={{ marginBottom: 'var(--sp-5)' }}>Common Questions</h2>
          <FaqAccordion items={VISIT_FAQS} />
        </div>
      </section>

      <section className="section" data-screen-label="Location & CTA">
        <div className="container">
          <div className="split-2" style={{ alignItems: 'start', gap: 'var(--sp-5)' }}>
            <div>
              <p className="t-eyebrow">Find Us</p>
              <h2 className="t-h2 mt-2">We&rsquo;re in the heart of Rahway</h2>
              <div style={{ marginTop: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: '.95rem', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <strong>15 Main St, Rahway, NJ 07065</strong>
                </div>
                <div style={{ fontSize: '.95rem', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  Sundays at 10:00 AM
                </div>
                <div style={{ fontSize: '.95rem', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  (732) 555-0100
                </div>
                <div style={{ fontSize: '.95rem', padding: '12px 0' }}>
                  info@oasisnj.net
                </div>
              </div>
              <div style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                <a href="https://maps.google.com/?q=Oasis+Christian+Centre+Rahway+NJ" target="_blank" rel="noopener" className="btn btn-primary">Get Directions</a>
                <Link href="/contact" className="btn btn-secondary">Contact Us</Link>
              </div>
            </div>
            <div className="map-placeholder img-placeholder" style={{ minHeight: 300, borderRadius: 'var(--radius-lg)' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="32" height="32" rx="4" stroke="#9BABB6" strokeWidth="1.5" /><path d="M12 28l5-10 6 6 4-8" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="28" cy="14" r="3" stroke="#9BABB6" strokeWidth="1.5" /></svg>
              <span>Google Maps embed<br />15 Main St, Rahway, NJ</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
