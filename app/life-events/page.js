import Link from 'next/link';
import './life-events.css';
import PageHero from '@/components/PageHero';
import FaqAccordion from '@/components/FaqAccordion';
import { getPageHero } from '@/lib/data';

export const metadata = { title: 'Life Events — Oasis Christian Centre' };
export const dynamic = 'force-dynamic';

const LIFE_EVENT_FAQS = [
  { q: 'Do I need to be a member to have a life event at Oasis?', a: "For baptism, no — anyone who has made a personal faith decision is welcome. For weddings and baby dedications, at least one person should have an established connection to Oasis. Contact us if you're unsure." },
  { q: 'Is baptism required to be a member?', a: "We encourage baptism as an important step of faith, but it's not a requirement for belonging to the Oasis community. We believe it's a personal decision made in your own time." },
  { q: 'What happens at the baptism info meeting?', a: "It's a relaxed, one-hour conversation with a pastor to talk through what baptism means, what to expect on the day, and answer any questions you have. No pressure, just preparation." },
  { q: 'Can family and friends come to watch?', a: 'Absolutely — and we encourage it. Baptisms, dedications, and milestone moments are always better shared. Invite your people and celebrate together.' },
];

export default async function LifeEventsPage() {
  const hero = await getPageHero('life-events');

  return (
    <>
      <PageHero
        eyebrow="Next Steps"
        title={(hero && hero.title) || 'Life Events'}
        description={(hero && hero.intro) || "Some moments in life deserve to be marked. We're honored to stand with you for the ones that matter most."}
        image={hero && hero.image}
      />

      <section className="section" data-screen-label="Intro">
        <div className="container-narrow text-center">
          <p className="t-eyebrow">Sacred Milestones</p>
          <h2 className="t-h1 mt-2">We&rsquo;re here for every chapter.</h2>
          <p className="t-body t-muted mt-3">Whether you&rsquo;re celebrating new life, declaring your faith, or bringing your family before God — Oasis is a place where these moments are treated with the care and reverence they deserve.</p>
        </div>
      </section>

      <section className="section bg-off" data-screen-label="Baptism">
        <div className="container">
          <div className="life-event-card">
            <div className="life-event-img img-placeholder">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M8 36c2-8 8-14 16-14s14 6 16 14" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /><circle cx="24" cy="14" r="8" stroke="#9BABB6" strokeWidth="1.5" /><path d="M24 28v8" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span>Baptism photo<br />Pool / baptism moment</span>
            </div>
            <div className="life-event-body">
              <p className="t-eyebrow">Water Baptism</p>
              <h2 className="mt-2">Take the step of baptism.</h2>
              <p>Baptism is a public declaration of your faith in Jesus Christ — a powerful, personal moment that says to the world: I&rsquo;m all in. We hold Baptism Sundays throughout the year and would love for you to be part of one.</p>
              <div className="req-list">
                <div className="req-item"><span className="req-num">01</span> You&rsquo;ve made a personal decision to follow Jesus</div>
                <div className="req-item"><span className="req-num">02</span> Attend a short baptism info meeting (1 hour)</div>
                <div className="req-item"><span className="req-num">03</span> Register below — we handle the rest</div>
              </div>
              <a href="#baptism-form" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Register for Baptism</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section" data-screen-label="Baby Dedication">
        <div className="container">
          <div className="life-event-card">
            <div className="life-event-img img-placeholder">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="14" r="8" stroke="#9BABB6" strokeWidth="1.5" /><path d="M10 40c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /><circle cx="36" cy="20" r="5" stroke="#9BABB6" strokeWidth="1.5" /></svg>
              <span>Baby dedication photo<br />Pastor, parents, baby</span>
            </div>
            <div className="life-event-body">
              <p className="t-eyebrow">Baby Dedication</p>
              <h2 className="mt-2">Dedicate your child to God.</h2>
              <p>A baby dedication is a beautiful moment where parents publicly commit to raise their child in faith, and the church family pledges to walk alongside them. It&rsquo;s not a salvation ceremony — it&rsquo;s a covenant of intention before God and community.</p>
              <div className="req-list">
                <div className="req-item"><span className="req-num">01</span> At least one parent or guardian is a follower of Jesus</div>
                <div className="req-item"><span className="req-num">02</span> Brief meeting with a pastor prior to the service</div>
                <div className="req-item"><span className="req-num">03</span> Takes place during a regular Sunday service</div>
              </div>
              <a href="#dedication-form" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Request a Dedication</a>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-off" data-screen-label="Marriage">
        <div className="container">
          <div className="life-event-card">
            <div className="life-event-img img-placeholder">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M24 40s-18-10-18-22a10 10 0 0 1 18-6 10 10 0 0 1 18 6c0 12-18 22-18 22z" stroke="#9BABB6" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              <span>Wedding / couple photo</span>
            </div>
            <div className="life-event-body">
              <p className="t-eyebrow">Marriage</p>
              <h2 className="mt-2">Get married at Oasis.</h2>
              <p>We believe marriage is a sacred covenant, and we&rsquo;d be honored to be part of yours. Our pastoral team offers pre-marital counseling and can officiate wedding ceremonies for couples connected to Oasis.</p>
              <div className="req-list">
                <div className="req-item"><span className="req-num">01</span> At least one partner is an active Oasis member</div>
                <div className="req-item"><span className="req-num">02</span> Minimum 6 sessions of pre-marital counseling</div>
                <div className="req-item"><span className="req-num">03</span> Contact us at least 6 months in advance</div>
              </div>
              <Link href="/contact" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Get in Touch</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" data-screen-label="Memorial">
        <div className="container">
          <div className="life-event-card">
            <div className="life-event-img img-placeholder">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M24 6v36M12 18h24" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span>Memorial / pastoral care photo</span>
            </div>
            <div className="life-event-body">
              <p className="t-eyebrow">Memorial Services</p>
              <h2 className="mt-2">Grief deserves a safe place.</h2>
              <p>When you&rsquo;ve lost someone dear, Oasis is here. Our pastoral team is available to walk with you through grief, officiate memorial services, and surround your family with care and prayer during the hardest of seasons.</p>
              <p style={{ fontStyle: 'italic', color: 'var(--charcoal)', fontFamily: 'var(--font-head)', fontSize: '1rem' }}>&ldquo;He heals the brokenhearted and binds up their wounds.&rdquo; — Psalm 147:3</p>
              <Link href="/contact" className="btn btn-primary mt-3" style={{ alignSelf: 'flex-start' }}>Contact Our Care Team</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-blue-light" id="baptism-form" data-screen-label="Forms">
        <div className="container">
          <div className="split-2" style={{ alignItems: 'start' }}>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-5)', boxShadow: 'var(--shadow-md)' }}>
              <p className="t-eyebrow" style={{ color: 'var(--blue)' }}>Water Baptism</p>
              <h3 className="t-h2 mt-2" style={{ marginBottom: 'var(--sp-4)' }}>Register for Baptism</h3>
              <div className="form-group"><label className="form-label">Full Name *</label><input type="text" className="form-input" placeholder="Your full name" /></div>
              <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" placeholder="your@email.com" /></div>
              <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-input" placeholder="(732) 555-0000" /></div>
              <div className="form-group"><label className="form-label">Preferred Baptism Date</label>
                <select className="form-input">
                  <option>April 27, 2026</option>
                  <option>June 28, 2026</option>
                  <option>September 2026</option>
                  <option>Open to any date</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Share your story (optional)</label><textarea className="form-textarea" placeholder="What led you to this decision?" style={{ minHeight: 80 }}></textarea></div>
              <button className="btn btn-primary full-w" style={{ justifyContent: 'center' }}>Submit Registration</button>
            </div>

            <div id="dedication-form" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-5)', boxShadow: 'var(--shadow-md)' }}>
              <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>Baby Dedication</p>
              <h3 className="t-h2 mt-2" style={{ marginBottom: 'var(--sp-4)' }}>Request a Dedication</h3>
              <div className="form-row-2">
                <div className="form-group"><label className="form-label">Parent / Guardian Name *</label><input type="text" className="form-input" placeholder="Your name" /></div>
                <div className="form-group"><label className="form-label">Partner&rsquo;s Name</label><input type="text" className="form-input" placeholder="Partner's name" /></div>
              </div>
              <div className="form-group"><label className="form-label">Child&rsquo;s Name *</label><input type="text" className="form-input" placeholder="Child's full name" /></div>
              <div className="form-group"><label className="form-label">Child&rsquo;s Date of Birth</label><input type="date" className="form-input" /></div>
              <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-input" placeholder="your@email.com" /></div>
              <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-input" placeholder="(732) 555-0000" /></div>
              <div className="form-group"><label className="form-label">Preferred Sunday</label><input type="text" className="form-input" placeholder="e.g. May or June 2026" /></div>
              <button className="btn btn-amber full-w" style={{ justifyContent: 'center' }}>Submit Request</button>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-off" data-screen-label="FAQ">
        <div className="container-narrow">
          <h2 className="t-h2 text-center" style={{ marginBottom: 'var(--sp-5)' }}>Common Questions</h2>
          <FaqAccordion items={LIFE_EVENT_FAQS} />
        </div>
      </section>
    </>
  );
}
