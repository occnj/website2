import Link from 'next/link';
import './about.css';
import PageHero from '@/components/PageHero';
import AboutSubnav from '@/components/AboutSubnav';
import { getPageHero } from '@/lib/data';

export const metadata = {
  title: 'About Us — Oasis Christian Centre',
  description: 'We are a thriving, multi-ethnic church who loves God and people. Know God, Find Hope, Make A Difference.',
};
export const dynamic = 'force-dynamic';

const VALUES = [
  ['Jesus', 'We will live in the love of Jesus, not from the standards of culture; and in that love, we will influence culture.'],
  ['Authenticity', 'Our leaders and volunteers will be visible, transparent, and approachable.'],
  ['Teaching', 'Our teachings will be Bible-based, relatable, and repeatable.'],
  ['Growth', 'Healthy things grow, growing things change, and changing things change things. We are committed to growth.'],
  ['People', 'We are a church of people with names and feelings, not egos and titles. We are better when connected together.'],
  ['Faith', 'We will honor our big God with our big faith and faith-filled prayers in all that we do.'],
  ['Serving', 'The local church should impact the world in which we live. We will serve people next to us and far from us.'],
  ['Generosity', 'We are a church generous with time, talents, and treasures — ready and resourced to do what God calls us to do.'],
  ['Worship', 'We value worship as a lifestyle, so we can welcome and reflect the presence of God in all that we do.'],
  ['Work', 'Anything worth doing is worth doing right. We will do everything with integrity, working as a team so no one burns out.'],
];

const BELIEFS = [
  ['God', 'Genesis 1:1, 26–27 · Deuteronomy 6:4 · Matthew 28:19', 'There is only one, true God, eternally existing in three distinct personalities: the Father, the Son, and the Holy Spirit. These three are one God, having the same nature, attributes, and perfections, and are therefore worthy of the same worship and obedience. God is the Creator, Sustainer, and Ruler of the universe.'],
  ['The Holy Spirit', 'John 14:16–17 · Acts 1:8 · Galatians 5:22–25', 'The Holy Spirit is coequal with the Father and the Son. He convicts people of sin, regenerates believers, and lives in them to manifest the character of Christ. He provides power for holy living, understanding of spiritual truth, and gives spiritual gifts for service that surpass our own natural abilities.'],
  ['Jesus Christ', 'John 1:1–5 · Colossians 1:15–20 · 1 Corinthians 15:3–4', 'Jesus Christ is the Son of God, coequal with the Father. He became a man, born of the virgin Mary, and lived a sinless life. He offered Himself as the perfect sacrifice for the sins of all people, rose bodily from the dead after three days, ascended to heaven, and will return to reign as King of Kings and Lord of Lords.'],
  ['Salvation', 'John 1:12 · Romans 6:23 · Ephesians 2:8–9', 'Because people are unable to save themselves, salvation is altogether the work of God — a free gift received by faith in Jesus Christ. Through repentance and faith, we turn from our self-ruled life to trust in Jesus as Lord and Savior. Neither good works nor self-improvement can substitute for this grace.'],
  ['People', 'Genesis 1:26–27 · Isaiah 53:6 · Romans 3:23', 'People are created in the image of God and are the supreme object of God’s creation and love. Through willful disobedience, people have fallen from their created state of righteousness and are separated from God — unable to deliver themselves, but fully dependent on the power of God as presented in the Gospel.'],
  ['Eternal Destiny', 'John 3:16 · Matthew 25:31–46 · Revelation 20:11–15', 'God created people to exist forever. We will either exist eternally separated from God by sin, or eternally with God through forgiveness and salvation. Heaven and Hell are real places of eternal existence.'],
  ['The Church', 'Matthew 16:16–18 · Ephesians 1:22–23 · 1 Corinthians 12:12–13', 'The church is composed of all who have experienced new birth through faith in Christ. The local church is an indispensable part of God’s plan — for worship, prayer, fellowship, teaching, ministry, and world evangelism. We believe in the spiritual unity of all true believers in the Lord Jesus Christ.'],
  ['Marriage', 'Mark 10:6–9', 'Oasis Christian Centre believes in the sanctity of marriage between one man and one woman, as established by God at creation. Married people are expected to maintain their marriage vows to each other.'],
];

const MINISTRIES = [
  ['WOW — Women of Worth', 'A sisterhood of women growing in faith, prayer, and purpose. Through brunches, Bible studies, and real conversations, WOW builds women who lead with grace.', 'var(--blue)'],
  ['FMO — For Men Only', 'Men doing life together — anchored in the Word, accountable to each other, and moving forward with purpose. Brotherhood that goes beyond Sunday.', 'var(--amber)'],
  ['The Collective — Youth', 'Young adults and high school students building community, deepening faith, and discovering their God-given purpose together.', '#4A8C6A'],
  ['Kids Ministry', 'Safe, fun, and age-appropriate environments from nursery through middle school. Our kids team is committed to raising the next generation in faith.', '#8B6BAE'],
  ['The Journey', 'For those navigating recovery, restoration, or a fresh start. The Journey walks alongside people with grace, truth, and practical support.', '#C45E4A'],
  ['Missions', 'Oasis is a sending church. We actively support global mission partners and mobilize our congregation to make a difference both locally and around the world.', 'var(--charcoal)'],
];

export default async function AboutPage() {
  const hero = await getPageHero('about');

  return (
    <>
      <PageHero
        eyebrow="Who We Are"
        title={(hero && hero.title) || 'About Us'}
        description={(hero && hero.intro) || 'We are a thriving, multi-ethnic church who loves God and people. Welcome to Oasis Christian Centre.'}
        image={hero && hero.image}
      />

      <AboutSubnav />

      {/* OUR STORY */}
      <section className="section" id="our-story" data-screen-label="Our Story">
        <div className="container">
          <div className="split-2" style={{ gap: 'var(--sp-7)' }}>
            <div>
              <p className="t-eyebrow">Our Story</p>
              <h2 className="t-h1 mt-2">Know God.<br />Find Hope.<br />Make a Difference.</h2>
              <p className="t-body t-muted mt-3">Welcome to Oasis Christian Centre. We are a thriving, multi-ethnic church who loves God and people — rooted in Rahway, NJ and committed to serving our community and the world.</p>
              <p className="t-body t-muted mt-3">Oasis is a place where faith is real, community is genuine, and everyone belongs. Whether you are stepping into a church for the first time or looking for a place to go deeper, you are welcome here exactly as you are.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 'var(--sp-4)' }}>
                {['Multi-ethnic, multigenerational community', 'Bible-based, relatable teaching every Sunday', 'Local outreach & global missions'].map((t, i, arr) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ width: 2, height: 20, background: 'var(--blue)', flexShrink: 0, borderRadius: 2 }}></span>
                    <span style={{ fontSize: '.95rem' }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                <Link href="/plan-your-visit" className="btn btn-primary">Plan Your Visit</Link>
                <a href="#our-values" className="btn btn-secondary">Our Values</a>
              </div>
            </div>
            <div>
              <div className="img-placeholder" style={{ aspectRatio: '4/5', borderRadius: 'var(--radius-lg)', minHeight: 480 }}>
                <svg width="52" height="52" viewBox="0 0 48 48" fill="none"><path d="M24 6C13.507 6 5 14.507 5 25s8.507 19 19 19 19-8.507 19-19S34.493 6 24 6z" stroke="#9BABB6" strokeWidth="1.5" /><path d="M24 14v11l7 4" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /></svg>
                <span>Church congregation photo<br />Worship / community moment</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK LINKS HUB */}
      <section className="section bg-off" data-screen-label="About Hub">
        <div className="container">
          <p className="t-eyebrow text-center">Explore</p>
          <h2 className="t-h2 text-center mt-2" style={{ marginBottom: 'var(--sp-5)' }}>Get to know us</h2>
          <div className="hub-grid">
            <a href="#our-values" className="hub-card">
              <div className="hub-card-num">01</div>
              <div className="hub-card-title">Our Values</div>
              <div className="hub-card-desc">The 10 convictions that shape everything we do at Oasis.</div>
            </a>
            <a href="#our-beliefs" className="hub-card">
              <div className="hub-card-num">02</div>
              <div className="hub-card-title">Our Beliefs</div>
              <div className="hub-card-desc">What we believe about God, Scripture, salvation, and the church.</div>
            </a>
            <Link href="/leadership" className="hub-card">
              <div className="hub-card-num">03</div>
              <div className="hub-card-title">Leadership</div>
              <div className="hub-card-desc">Meet the pastoral team and ministry leaders who serve Oasis.</div>
            </Link>
            <a href="#ministries" className="hub-card">
              <div className="hub-card-num">04</div>
              <div className="hub-card-title">Ministries</div>
              <div className="hub-card-desc">From women to youth to missions — see all the ways we serve.</div>
            </a>
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="section" id="our-values" data-screen-label="Our Values">
        <div className="container">
          <div style={{ maxWidth: 640, margin: '0 auto var(--sp-6)', textAlign: 'center' }}>
            <p className="t-eyebrow">Our Values</p>
            <h2 className="t-h1 mt-2">What defines us.</h2>
            <p className="t-body t-muted mt-3">Our values direct the culture of Oasis. They define who we are. These values are so critical to our mission that we will adjust anything to achieve and maintain them.</p>
          </div>
          <div className="values-grid">
            {VALUES.map(([title, desc], i) => (
              <div className="value-card" key={title}>
                <div className="value-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="value-title">{title}</div>
                <div className="value-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR BELIEFS */}
      <section className="section bg-off" id="our-beliefs" data-screen-label="Our Beliefs">
        <div className="container">
          <div style={{ maxWidth: 640, margin: '0 auto var(--sp-6)' }}>
            <p className="t-eyebrow">Our Beliefs</p>
            <h2 className="t-h1 mt-2">What we believe.</h2>
            <p className="t-body t-muted mt-3">We believe the Bible — composed of the sixty-six books of the Old and New Testaments — to be the inspired Word of God and the final authority for all matters of faith and practice.</p>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', marginTop: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontSize: '.9rem', color: 'var(--charcoal)', lineHeight: 1.7 }}>
                <strong>In essential beliefs</strong> — we have unity <span style={{ color: 'var(--gray-1)' }}>(Ephesians 4:4-6)</span><br />
                <strong>In nonessential beliefs</strong> — we have liberty <span style={{ color: 'var(--gray-1)' }}>(Romans 14:1,4,12,22)</span><br />
                <strong>In all our beliefs</strong> — we exhibit charity <span style={{ color: 'var(--gray-1)' }}>(1 Corinthians 13:2; Ephesians 4:15)</span>
              </p>
            </div>
          </div>

          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {BELIEFS.map(([label, scripture, text]) => (
              <div className="belief-item" key={label}>
                <div>
                  <div className="belief-label">{label}</div>
                  <div className="belief-scripture">{scripture}</div>
                </div>
                <div className="belief-text">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MINISTRIES */}
      <section className="section" id="ministries" data-screen-label="Ministries">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
            <div>
              <p className="t-eyebrow">Ministries</p>
              <h2 className="t-h2 mt-2">A place for everyone.</h2>
            </div>
            <p className="t-body t-muted" style={{ maxWidth: 380 }}>Every ministry at Oasis exists to help people know God, find their people, and make a real difference.</p>
          </div>
          <div className="grid-3">
            {MINISTRIES.map(([title, desc, color]) => (
              <div key={title} style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${color}` }}>
                <h3 className="t-h3">{title}</h3>
                <p className="t-small t-muted mt-2">{desc}</p>
                <a href="#" className="btn btn-secondary btn-sm mt-3">Learn More</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSIONS */}
      <section className="section bg-charcoal" id="missions" data-screen-label="Missions">
        <div className="container">
          <div className="split-2" style={{ gap: 'var(--sp-7)' }}>
            <div>
              <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>Missions</p>
              <h2 className="t-h1 text-white mt-2">We are a<br />sending church.</h2>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '1rem', lineHeight: 1.75, marginTop: 'var(--sp-3)' }}>The Great Commission isn&rsquo;t a suggestion — it&rsquo;s our mandate. Oasis actively supports missionary partners around the world and mobilizes our congregation to serve both locally in Rahway and globally.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 'var(--sp-4)' }}>
                {['Active global mission partners', 'Local outreach in Rahway, NJ', 'Mission trips and sending opportunities'].map((t, i, arr) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
                    <span style={{ width: 2, height: 20, background: 'var(--amber)', flexShrink: 0, borderRadius: 2 }}></span>
                    <span style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.8)' }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-2)' }}>
                <Link href="/give" className="btn btn-amber">Support Missions</Link>
                <Link href="/contact" className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }}>Get Involved →</Link>
              </div>
            </div>
            <div className="img-placeholder img-placeholder-dark" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)' }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" /><path d="M6 24h36M24 6c-4 6-6 12-6 18s2 12 6 18M24 6c4 6 6 12 6 18s-2 12-6 18" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" /></svg>
              <span>Missions / outreach photo</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVE */}
      <section className="section" id="serve" data-screen-label="Serve">
        <div className="container">
          <div className="split-2" style={{ gap: 'var(--sp-7)' }}>
            <div className="img-placeholder" style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-lg)' }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M8 20h32M16 8v8M32 8v8" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /><rect x="8" y="12" width="32" height="28" rx="4" stroke="#9BABB6" strokeWidth="1.5" /><circle cx="24" cy="28" r="6" stroke="#9BABB6" strokeWidth="1.5" /></svg>
              <span>Volunteers serving photo<br />Teams in action</span>
            </div>
            <div>
              <p className="t-eyebrow">Serve</p>
              <h2 className="t-h1 mt-2">Your gifts<br />were made<br />for this.</h2>
              <p className="t-body t-muted mt-3">Every person at Oasis has something to offer. When you serve, you stop being an audience member and become part of the team that makes Sundays happen — and the community thrive.</p>
              <p className="t-body t-muted mt-3">From worship to media, from kids ministry to hospitality — there&rsquo;s a team waiting for someone exactly like you.</p>
              <div style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-primary">Find Your Team</Link>
                <Link href="/contact" className="btn btn-secondary">Talk to Someone</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--blue)', padding: 'var(--sp-7) 0' }} data-screen-label="CTA">
        <div className="container text-center">
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, color: '#fff', marginBottom: 'var(--sp-2)' }}>Ready to take your next step?</h2>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '1.05rem', maxWidth: 440, margin: '0 auto var(--sp-4)', lineHeight: 1.65 }}>Join us this Sunday and find out what Oasis is all about — in person.</p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/plan-your-visit" className="btn btn-ghost btn-lg">Plan Your Visit</Link>
            <Link href="/contact" className="btn" style={{ background: '#fff', color: 'var(--blue)', padding: '18px 36px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '1rem' }}>Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
