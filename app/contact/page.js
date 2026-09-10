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
              <div className="contact-info-card" data-screen-label="Our Story">
                <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 'var(--sp-3)' }}>Our Story</h3>
                <div className="contact-history">
                  <p>Oasis Christian Centre began with a simple vision: to be a place where anyone could come as they are and discover who God really is. What started as a small gathering has grown into a community committed to knowing God, finding hope, and making a difference in Rahway and beyond.</p>
                  <p>Over the years we have grown in number and in heart, but our purpose has never changed. We are a church of people — with names and stories, not titles — who believe the local church should impact the world around it. Whether you are exploring faith for the first time or have walked with Jesus for decades, there is a place for you here.</p>
                  <p>We would love to tell you more in person. Reach out using the form, and someone from our team will be glad to connect with you.</p>
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
            <Link href="/prayer" style={{ display: 'block' }}>
              <div className="step-card" style={{ borderTopColor: 'var(--amber)', cursor: 'pointer' }}>
                <h3 className="t-h3">Prayer Request</h3>
                <p className="t-small t-muted mt-2">Submit a prayer request and our dedicated team will stand with you.</p>
              </div>
            </Link>
            <Link href="/about#ministries" style={{ display: 'block' }}>
              <div className="step-card" style={{ borderTopColor: '#4A8C6A', cursor: 'pointer' }}>
                <h3 className="t-h3">Join a Team</h3>
                <p className="t-small t-muted mt-2">Find your place to serve and use your gifts for something that matters.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
