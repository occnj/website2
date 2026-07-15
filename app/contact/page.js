import Link from 'next/link';
import './contact.css';
import PageHero from '@/components/PageHero';
import ContactForm from '@/components/ContactForm';
import { getPageHero } from '@/lib/data';

export const metadata = {
  title: 'Contact — Oasis Christian Centre',
  description: "Get in touch with Oasis Christian Centre in Rahway, NJ. We'd love to hear from you.",
};
export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const hero = await getPageHero('contact');

  return (
    <>
      <PageHero
        eyebrow="We'd Love to Hear From You"
        title={(hero && hero.title) || 'Get in Touch'}
        description={(hero && hero.intro) || 'Whether you have a question, need prayer, or just want to say hello — our team is here and glad to connect.'}
        image={hero && hero.image}
      />

      <section className="section" data-screen-label="Contact Form">
        <div className="container">
          <div className="contact-grid">
            <div>
              <div className="contact-info-card">
                <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 'var(--sp-3)' }}>Oasis Christian Centre</h3>

                <div className="contact-info-item">
                  <div>
                    <div className="contact-info-label">Address</div>
                    <div className="contact-info-value">15 Main St<br />Rahway, NJ 07065</div>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div>
                    <div className="contact-info-label">Service Times</div>
                    <div className="contact-info-value">Sunday · 10:00 AM</div>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div>
                    <div className="contact-info-label">Phone</div>
                    <div className="contact-info-value">(732) 555-0100</div>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div>
                    <div className="contact-info-label">Email</div>
                    <div className="contact-info-value">info@oasisnj.net</div>
                  </div>
                </div>

                <div className="office-hours">
                  <h4>Office Hours</h4>
                  <div className="office-row"><span>Tuesday – Thursday</span><span>10 AM – 4 PM</span></div>
                  <div className="office-row"><span>Friday</span><span>10 AM – 2 PM</span></div>
                  <div className="office-row"><span>Sunday</span><span>9 AM – 12 PM</span></div>
                  <div className="office-row"><span>Monday / Saturday</span><span>Closed</span></div>
                </div>

                <div style={{ marginTop: 'var(--sp-3)', display: 'flex', gap: 10 }}>
                  {['fb', 'ig', 'yt'].map((k) => (
                    <a key={k} href="#" style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,.1)', display: 'grid', placeItems: 'center', fontSize: '.75rem', fontWeight: 700, color: 'rgba(255,255,255,.7)' }}>{k}</a>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'var(--sp-3)' }}>
                <div className="img-placeholder" style={{ borderRadius: 'var(--radius-md)', aspectRatio: '16/7' }}>
                  <svg width="36" height="36" viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="32" height="32" rx="4" stroke="#9BABB6" strokeWidth="1.5" /><path d="M12 28l5-10 6 6 4-8" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="28" cy="14" r="3" stroke="#9BABB6" strokeWidth="1.5" /></svg>
                  <span>Google Maps embed<br />15 Main St, Rahway, NJ</span>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      <section className="section bg-off" data-screen-label="Quick Links">
        <div className="container">
          <h2 className="t-h2 text-center" style={{ marginBottom: 'var(--sp-5)' }}>Looking for something specific?</h2>
          <div className="grid-3">
            <Link href="/plan-your-visit" style={{ display: 'block' }}>
              <div className="step-card" style={{ cursor: 'pointer' }}>
                <h3 className="t-h3">Plan Your Visit</h3>
                <p className="t-small t-muted mt-2">First time coming? We&rsquo;ve prepared everything you need to feel at home.</p>
              </div>
            </Link>
            <a href="#" style={{ display: 'block' }}>
              <div className="step-card" style={{ borderTopColor: 'var(--amber)', cursor: 'pointer' }}>
                <h3 className="t-h3">Prayer Request</h3>
                <p className="t-small t-muted mt-2">Submit a prayer request and our dedicated team will stand with you.</p>
              </div>
            </a>
            <a href="#" style={{ display: 'block' }}>
              <div className="step-card" style={{ borderTopColor: '#4A8C6A', cursor: 'pointer' }}>
                <h3 className="t-h3">Join a Team</h3>
                <p className="t-small t-muted mt-2">Find your place to serve and use your gifts for something that matters.</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
