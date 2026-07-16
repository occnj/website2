import Link from 'next/link';
import './home.css';
import { getPageHero, getUpcomingEvents, getSermons } from '@/lib/data';
import { getChannelVideos } from '@/lib/youtube';
import { asset } from '@/lib/basePath';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [hero, events, ytVideos, dbSermons] = await Promise.all([
    getPageHero('index'),
    getUpcomingEvents(),
    getChannelVideos(),
    getSermons(),
  ]);
  const sermons = ytVideos.length ? ytVideos : dbSermons;
  const heroImage = (hero && hero.image) || asset('/images/hero-placeholder.svg');
  const heroTitle = (hero && hero.title) || 'You were made to belong here.';
  const heroIntro = (hero && hero.intro) ||
    "Oasis Christian Centre is a warm, Spirit-led community where everyone is welcome. Come as you are — no matter where you've been.";
  const latestSermon = sermons.find((s) => s.featured) || sermons[0];
  const upcoming = events.slice(0, 4);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero-home" data-screen-label="Hero">
        <div className="hero-bg-placeholder"></div>
        <div className="hero-bg-pattern"></div>
        <div className="hero-photo-area">
          <div className="hero-photo-fade"></div>
          <img src={heroImage} alt="Oasis Christian Centre congregation" />
        </div>
        <div className="hero-content-wrap">
          <div className="container">
            <div className="hero-eyebrow"><span className="dot"></span>Sundays · 10:00 AM · Rahway, NJ</div>
            <h1 className="hero-headline" dangerouslySetInnerHTML={{ __html: heroTitle.includes('<') ? heroTitle : 'You were made<br />to <em>belong</em> here.' }} />
            <p className="hero-sub">{heroIntro}</p>
            <div className="hero-actions">
              <Link href="/plan-your-visit" className="btn btn-primary btn-lg">Plan Your Visit</Link>
              <Link href="/watch" className="btn btn-ghost btn-lg">Watch a Message</Link>
            </div>
          </div>
        </div>
        <div className="hero-scroll">
          <div className="scroll-line"></div>
          <span>Scroll</span>
        </div>
      </section>

      {/* ===== SERVICE INFO STRIP ===== */}
      <div className="info-strip" data-screen-label="Service Info Strip">
        <div className="container">
          <div className="info-strip-inner">
            <div className="info-item">
              <div className="info-item-text">
                <strong>Sunday Service</strong>
                <span>10:00 AM</span>
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,.1)' }}></div>
            <div className="info-item">
              <div className="info-item-text">
                <strong>15 Main St, Rahway, NJ</strong>
                <span>Get Directions →</span>
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,.1)' }}></div>
            <div className="info-item">
              <div className="info-item-text">
                <strong>Kids & Youth</strong>
                <span>Nursery through High School</span>
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,.1)' }}></div>
            <Link href="/plan-your-visit" className="btn btn-ghost btn-sm">First time? →</Link>
          </div>
        </div>
      </div>

      {/* ===== PLAN YOUR VISIT ===== */}
      <section className="section" data-screen-label="Plan Your Visit Teaser">
        <div className="container">
          <div className="visit-teaser">
            <div className="visit-teaser-img img-placeholder" style={{ minHeight: 380 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="8" width="32" height="32" rx="4" stroke="#9BABB6" strokeWidth="1.5" /><circle cx="24" cy="22" r="7" stroke="#9BABB6" strokeWidth="1.5" /><path d="M12 40c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span>Welcoming photo<br />Doors / lobby / greeter</span>
            </div>
            <div className="visit-teaser-content">
              <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>New Here?</p>
              <h2 className="t-h1 text-white mt-2">We&rsquo;ve been<br />expecting you.</h2>
              <p style={{ color: 'rgba(255,255,255,.7)', marginTop: 'var(--sp-3)', lineHeight: 1.7, fontSize: '1rem' }}>
                Your first visit matters. Here&rsquo;s everything you need to know — where to park, what to expect, and how we can make you feel right at home.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '.9rem', color: 'rgba(255,255,255,.8)' }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: '.75rem', fontWeight: 700, color: 'var(--blue)', minWidth: 20 }}>01</span>
                  Arrive any Sunday at 10:00 AM
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '.9rem', color: 'rgba(255,255,255,.8)' }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: '.75rem', fontWeight: 700, color: 'var(--blue)', minWidth: 20 }}>02</span>
                  Our team will welcome you at the door
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '.9rem', color: 'rgba(255,255,255,.8)' }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: '.75rem', fontWeight: 700, color: 'var(--blue)', minWidth: 20 }}>03</span>
                  Kids check-in is easy and safe
                </div>
              </div>
              <Link href="/plan-your-visit" className="btn btn-primary mt-4" style={{ alignSelf: 'flex-start' }}>Plan Your Visit →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GET INVOLVED ===== */}
      <section style={{ background: 'var(--charcoal)', padding: 'var(--sp-8) 0', position: 'relative', overflow: 'hidden' }} data-screen-label="Get Involved">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%,rgba(0,150,199,.08) 0%,transparent 60%)', pointerEvents: 'none' }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="split-2" style={{ alignItems: 'end', marginBottom: 'var(--sp-6)', paddingBottom: 'var(--sp-5)', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
            <div>
              <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>Get Involved</p>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(2.2rem,4.5vw,3.5rem)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-.025em', color: '#fff', marginTop: 'var(--sp-2)' }}>
                See how God can use<br />your gifts to make an<br /><em style={{ fontStyle: 'italic', color: 'var(--blue)' }}>eternal impact.</em>
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 380, marginBottom: 'var(--sp-4)' }}>Whether you&rsquo;re stepping in for the first time or ready to go deeper — there&rsquo;s a place for you here. Every path forward starts with one step.</p>
              <Link href="/about#ministries" className="btn btn-amber" style={{ alignSelf: 'flex-start' }}>Explore All Ways to Connect</Link>
            </div>
          </div>

          <div>
            <Link href="/about#ministries" className="involve-row">
              <div className="involve-row-inner">
                <div className="involve-left">
                  <span className="involve-num">01</span>
                  <div>
                    <div className="involve-title">Teams</div>
                    <div className="involve-desc">Use your gifts where they matter most. Worship, media, hospitality, children&rsquo;s ministry and more.</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/#circles" className="involve-row">
              <div className="involve-row-inner">
                <div className="involve-left">
                  <span className="involve-num">02</span>
                  <div>
                    <div className="involve-title">Circles</div>
                    <div className="involve-desc">Small groups built around real community, real faith, and real friendship. Find your people.</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/contact" className="involve-row">
              <div className="involve-row-inner">
                <div className="involve-left">
                  <span className="involve-num">03</span>
                  <div>
                    <div className="involve-title">Prayer</div>
                    <div className="involve-desc">You don&rsquo;t have to carry it alone. Our care team will personally stand with you in faith.</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/life-events" className="involve-row">
              <div className="involve-row-inner">
                <div className="involve-left">
                  <span className="involve-num">04</span>
                  <div>
                    <div className="involve-title">Life Events</div>
                    <div className="involve-desc">Baptism, baby dedications, and life&rsquo;s most sacred moments — we&rsquo;re here for all of them.</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== LATEST MESSAGE ===== */}
      <section className="section bg-off" data-screen-label="Latest Message">
        <div className="container">
          <div className="section-label">
            <p className="t-eyebrow">Latest Message</p>
          </div>
          <div className="message-featured">
            <div>
              <Link href="/watch" className="message-thumbnail">
                {latestSermon ? (
                  <img
                    src={latestSermon.thumbnail_url || `https://i.ytimg.com/vi/${latestSermon.youtube_id}/hqdefault.jpg`}
                    alt={latestSermon.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="img-placeholder img-placeholder-dark" style={{ aspectRatio: '16/9', borderRadius: 12, height: '100%' }}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="4" y="8" width="40" height="28" rx="4" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" /><polygon points="19,18 33,22 19,26" fill="rgba(255,255,255,.4)" /></svg>
                    <span>Sermon thumbnail / video preview</span>
                  </div>
                )}
                <div className="play-btn">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </div>
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'var(--sp-2) 0' }}>
              <div className="sermon-series">{(latestSermon && latestSermon.series) || 'Current Series'}</div>
              <h2 className="t-h2 mt-2">{(latestSermon && latestSermon.title) || 'Anchored: Finding Stability in an Uncertain World'}</h2>
              <p className="t-body t-muted mt-3">
                {(latestSermon && latestSermon.description) ||
                  'In this message, Pastor explores what it means to hold firm when the ground beneath us shifts — and how our faith becomes the anchor that keeps us steady.'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginTop: 'var(--sp-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="img-placeholder" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, padding: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#9BABB6" strokeWidth="1.5" /><path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#9BABB6" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{(latestSermon && latestSermon.speaker) || 'Pastor Name'}</div>
                    <div className="sermon-date">
                      {latestSermon && latestSermon.published_at
                        ? new Date(latestSermon.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'April 20, 2026'}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
                <Link href="/watch" className="btn btn-primary">Watch Now</Link>
                <Link href="/watch" className="btn btn-secondary">All Messages</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EVENTS ===== */}
      <section className="section bg-off" data-screen-label="Events">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            <div>
              <p className="t-eyebrow">What&rsquo;s Happening</p>
              <h2 className="t-h2 mt-2">Upcoming Events</h2>
            </div>
            <Link href="/events" className="btn btn-secondary btn-sm">View All Events</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {upcoming.length === 0 && (
              <p className="t-body t-muted">No upcoming events right now — check back soon.</p>
            )}
            {upcoming.map((e, i) => {
              const d = e.starts_at ? new Date(e.starts_at + 'T12:00:00') : null;
              return (
                <div className="event-card-row" key={e.id || i}>
                  <div className="event-date-block">
                    <div className="month">{d ? d.toLocaleString('en-US', { month: 'short' }) : e.month}</div>
                    <div className="day">{d ? d.getDate() : e.day}</div>
                  </div>
                  <div className="event-info">
                    <h4>{e.title}</h4>
                    <p>{[e.time_label, e.location, e.category].filter(Boolean).join(' · ')}</p>
                  </div>
                  <Link href="/events" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>Details</Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CIRCLES ===== */}
      <section className="section" id="circles" data-screen-label="Circles">
        <div className="container">
          <div className="section-label">
            <p className="t-eyebrow">Community</p>
          </div>
          <div className="split-2 split-wide">
            <div>
              <h2 className="t-h1">Life is better<br />in a Circle.</h2>
              <p className="t-body t-muted mt-3">Circles are Oasis&rsquo;s small groups — real, honest, intentional communities where you can grow in faith and find genuine friendship.</p>
              <Link href="/contact" className="btn btn-primary mt-4">Find Your Circle</Link>
            </div>
            <div className="circles-grid">
              <div className="circle-card">
                <h4>WOW Women</h4>
                <p>A sisterhood of women growing in faith, prayer, and purpose together.</p>
              </div>
              <div className="circle-card" style={{ borderLeftColor: 'var(--amber)' }}>
                <h4>FMO Men</h4>
                <p>Men doing life together — anchored, accountable, and moving forward.</p>
              </div>
              <div className="circle-card" style={{ borderLeftColor: '#8B6BAE' }}>
                <h4>The Journey</h4>
                <p>For those navigating a new season — recovery, growth, or fresh starts.</p>
              </div>
              <div className="circle-card" style={{ borderLeftColor: '#4A8C6A' }}>
                <h4>The Collective</h4>
                <p>Young adults building community, faith, and a vision for their lives.</p>
              </div>
              <div className="circle-card" style={{ borderLeftColor: '#C45E4A' }}>
                <h4>Couples & Families</h4>
                <p>Building strong homes and deeper faith together, season by season.</p>
              </div>
              <div className="circle-card" style={{ borderLeftColor: 'var(--blue)' }}>
                <h4>Mixed Groups</h4>
                <p>Open circles for anyone ready to connect with others in the community.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GIVE ===== */}
      <section className="section give-section" data-screen-label="Giving">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="split-2">
            <div>
              <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>Generosity</p>
              <h2 className="t-h1 text-white mt-2">Your generosity changes lives.</h2>
              <p style={{ color: 'rgba(255,255,255,.7)', marginTop: 'var(--sp-3)', fontSize: '1rem', lineHeight: 1.7 }}>
                Every gift supports our local community, our global missions, and the work of making Oasis a home for everyone who walks through our doors.
              </p>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
                <Link href="/give" className="btn btn-amber btn-lg">Give Online</Link>
                <Link href="/give" className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }}>Learn About Giving →</Link>
              </div>
            </div>
            <div className="grid-2-sm">
              <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', border: '1px solid rgba(255,255,255,.1)' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 700, color: 'var(--amber)' }}>Local</div>
                <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', marginTop: 8, lineHeight: 1.5 }}>Supporting our Rahway neighbors through outreach, care, and community</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', border: '1px solid rgba(255,255,255,.1)' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 700, color: 'var(--blue)' }}>Global</div>
                <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', marginTop: 8, lineHeight: 1.5 }}>Funding missions and ministry partners around the world</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', border: '1px solid rgba(255,255,255,.1)' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>Family</div>
                <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.6)', marginTop: 8, lineHeight: 1.5 }}>Building programs and spaces where every age group can thrive</p>
              </div>
              <div style={{ background: 'rgba(0,150,199,.12)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-4)', border: '1px solid rgba(0,150,199,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link href="/give" className="btn btn-amber" style={{ width: '100%', justifyContent: 'center' }}>Give Now →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRAYER ===== */}
      <section className="section bg-blue-light" data-screen-label="Prayer">
        <div className="container">
          <div className="prayer-section">
            <div>
              <p className="t-eyebrow">Care & Prayer</p>
              <h2 className="t-h1 mt-2">We&rsquo;re standing<br />with you.</h2>
              <p className="t-body t-muted mt-3">Whatever you&rsquo;re walking through — our prayer team is here. Submit a request and someone will personally pray over your situation.</p>
              <div style={{ marginTop: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '.95rem', padding: '14px 0', borderBottom: '1px solid rgba(26,40,53,.08)' }}>
                  <span style={{ width: 2, height: 20, background: 'var(--blue)', flexShrink: 0, borderRadius: 2 }}></span>
                  Confidential and personal
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '.95rem', padding: '14px 0', borderBottom: '1px solid rgba(26,40,53,.08)' }}>
                  <span style={{ width: 2, height: 20, background: 'var(--blue)', flexShrink: 0, borderRadius: 2 }}></span>
                  Dedicated prayer team responds
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '.95rem', padding: '14px 0' }}>
                  <span style={{ width: 2, height: 20, background: 'var(--blue)', flexShrink: 0, borderRadius: 2 }}></span>
                  No request is too big or too small
                </div>
              </div>
              <Link href="/contact" className="btn btn-primary mt-4">Submit a Prayer Request</Link>
            </div>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-5)', boxShadow: 'var(--shadow-md)' }}>
              <h3 className="t-h3" style={{ marginBottom: 'var(--sp-3)' }}>Send Us Your Request</h3>
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input type="text" className="form-input" placeholder="First name is fine" />
              </div>
              <div className="form-group">
                <label className="form-label">Email (optional)</label>
                <input type="email" className="form-input" placeholder="For a follow-up from our team" />
              </div>
              <div className="form-group">
                <label className="form-label">Your Prayer Request</label>
                <textarea className="form-textarea" placeholder="Share what's on your heart..." style={{ minHeight: 100 }}></textarea>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '.82rem', color: 'var(--gray-1)', cursor: 'pointer', marginBottom: 'var(--sp-3)' }}>
                <input type="checkbox" style={{ marginTop: 3, accentColor: 'var(--blue)' }} />
                Keep my request confidential (only seen by the prayer team)
              </label>
              <button className="btn btn-primary full-w" style={{ justifyContent: 'center' }}>Submit Request</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
