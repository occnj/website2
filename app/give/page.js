import Link from 'next/link';
import './give.css';
import GiveCard from '@/components/GiveCard';
import FaqAccordion from '@/components/FaqAccordion';

export const metadata = { title: 'Give — Oasis Christian Centre' };
export const dynamic = 'force-dynamic';

const GIVE_FAQS = [
  { q: 'Is my gift tax-deductible?', a: "Yes. Oasis Christian Centre is a registered 501(c)(3) non-profit organization. All contributions are tax-deductible to the full extent permitted by law. You'll receive an annual giving statement by January 31st." },
  { q: 'How is my gift used?', a: 'Gifts to the General Fund are allocated across ministry, staff, facility, local outreach, and global missions. We are committed to responsible stewardship and provide regular financial transparency to our congregation.' },
  { q: 'Can I set up recurring giving?', a: 'Yes — select "Give Regularly" on the giving form, then set up weekly, bi-weekly, or monthly automatic gifts on our secure giving page. You can modify or cancel at any time.' },
  { q: 'Is online giving secure?', a: 'Absolutely. All online transactions are completed on our secure, PCI-compliant giving page. Your financial information is never stored on our servers.' },
];

export default function GivePage() {
  return (
    <>
      <section className="give-hero" data-screen-label="Give Hero">
        <div className="container">
          <div className="give-hero-inner">
            <div>
              <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>Generosity</p>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(2.4rem,5vw,4rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-.025em', color: '#fff', marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
                Your generosity<br />changes <em style={{ fontStyle: 'italic', color: 'var(--amber)' }}>lives.</em>
              </h1>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 480, marginBottom: 'var(--sp-5)' }}>Every gift you give funds local outreach, global missions, and the work of building a community where people find hope. Thank you for being part of this.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {['Funds local outreach in Rahway', 'Supports global mission partners', 'Invests in programs for every generation'].map((t, i, arr) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
                    <span style={{ width: 2, height: 20, background: 'var(--amber)', flexShrink: 0, borderRadius: 2 }}></span>
                    <span style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.8)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <GiveCard />
          </div>
        </div>
      </section>

      <section className="section" data-screen-label="Impact">
        <div className="container">
          <div className="text-center" style={{ maxWidth: 560, margin: '0 auto var(--sp-6)' }}>
            <p className="t-eyebrow">Your Impact</p>
            <h2 className="t-h1 mt-2">See what your gift does.</h2>
            <p className="t-body t-muted mt-3">Every dollar given at Oasis is stewarded with care and transparency. Here&rsquo;s a glimpse of what generosity makes possible.</p>
          </div>
          <div className="impact-row">
            <div className="impact-card">
              <div className="impact-amount">$25</div>
              <p>Provides curriculum materials for one child&rsquo;s entire month of Kids Ministry</p>
            </div>
            <div className="impact-card" style={{ borderTopColor: 'var(--amber)' }}>
              <div className="impact-amount" style={{ color: 'var(--amber)' }}>$100</div>
              <p>Sponsors a community outreach event, feeding and serving our Rahway neighbors</p>
            </div>
            <div className="impact-card" style={{ borderTopColor: '#4A8C6A' }}>
              <div className="impact-amount" style={{ color: '#4A8C6A' }}>$500</div>
              <p>Funds a month of global mission support for one of our international partners</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-off" data-screen-label="Scripture">
        <div className="container">
          <div className="scripture-block">
            <p style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.3rem,3vw,2rem)', fontWeight: 600, fontStyle: 'italic', color: '#fff', lineHeight: 1.5, maxWidth: 700, margin: '0 auto var(--sp-2)', position: 'relative', zIndex: 1 }}>
              &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
            </p>
            <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>2 Corinthians 9:7</p>
          </div>
        </div>
      </section>

      <section className="section" data-screen-label="Other Ways to Give">
        <div className="container">
          <div className="text-center" style={{ maxWidth: 480, margin: '0 auto var(--sp-6)' }}>
            <p className="t-eyebrow">Other Ways</p>
            <h2 className="t-h2 mt-2">More ways to give</h2>
          </div>
          <div className="give-methods">
            <div className="give-method">
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: 'var(--sp-2)' }}>In Person</div>
              <p>Drop your gift in the offering during any Sunday service. Cash and checks are welcome — make checks payable to <em>Oasis Christian Centre</em>.</p>
            </div>
            <div className="give-method">
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: 'var(--sp-2)' }}>By Mail</div>
              <p>Send a check to:<br /><strong>Oasis Christian Centre</strong><br />15 Main St<br />Rahway, NJ 07065</p>
            </div>
            <div className="give-method">
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: 'var(--sp-2)' }}>Planned Giving</div>
              <p>Interested in leaving a legacy gift or including Oasis in your estate plans? Contact our office to learn more about how to make a lasting impact.</p>
              <Link href="/contact" className="btn btn-secondary btn-sm mt-3">Get in Touch</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-off" data-screen-label="FAQ">
        <div className="container-narrow">
          <h2 className="t-h2 text-center" style={{ marginBottom: 'var(--sp-5)' }}>Questions About Giving</h2>
          <FaqAccordion items={GIVE_FAQS} />
        </div>
      </section>
    </>
  );
}
