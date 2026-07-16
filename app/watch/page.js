import './watch.css';
import PageHero from '@/components/PageHero';
import SermonGrid from '@/components/SermonGrid';
import { getPageHero, getSermons } from '@/lib/data';
import { getChannelVideos, YT_CHANNEL_URL, YT_LIVE_URL } from '@/lib/youtube';

export const metadata = {
  title: 'Watch — Oasis Christian Centre',
  description: 'Watch messages from Oasis Christian Centre online. Every sermon, every series — available anytime.',
};
export const dynamic = 'force-dynamic';

export default async function WatchPage() {
  // Everything on this page comes from the Oasis YouTube channel (@OCCNJ).
  // If the feed is unreachable, fall back to sermons added in the Admin.
  const [hero, ytVideos, dbSermons] = await Promise.all([
    getPageHero('watch'),
    getChannelVideos(),
    getSermons(),
  ]);
  const sermons = ytVideos.length ? ytVideos : dbSermons;
  const featured = sermons.find((s) => s.featured) || sermons[0];

  return (
    <>
      <PageHero
        eyebrow="Messages & Media"
        title={(hero && hero.title) || 'Watch'}
        description={(hero && hero.intro) || 'Every message, every series — available anytime. Watch online or join us live every Sunday at 10 AM.'}
        image={hero && hero.image}
      />

      <div style={{ background: 'linear-gradient(90deg,#8B0000,#C53030)', padding: 'var(--sp-2) 0' }} data-screen-label="Live Banner">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', color: '#fff' }}>
              <span className="live-badge"><span className="live-dot"></span>Live Now</span>
              <span style={{ fontSize: '.9rem', fontWeight: 500 }}>Sunday Service is streaming live right now</span>
            </div>
            <a href={YT_LIVE_URL} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">Join the Stream →</a>
          </div>
        </div>
      </div>

      <section className="section" data-screen-label="Latest Message Featured">
        <div className="container">
          <div className="section-label">
            <p className="t-eyebrow">Latest Message</p>
          </div>
          <div className="featured-sermon">
            <div className="featured-sermon-video" data-featured-sermon>
              {featured ? (
                <iframe
                  src={`https://www.youtube.com/embed/${featured.youtube_id}`}
                  title={featured.title}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                  allowFullScreen
                />
              ) : (
                <>
                  <div className="img-placeholder img-placeholder-dark" style={{ height: '100%', minHeight: 340 }}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="4" y="8" width="40" height="28" rx="4" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" /><polygon points="19,18 33,22 19,26" fill="rgba(255,255,255,.4)" /></svg>
                    <span>Video embed / YouTube<br />Latest sermon</span>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="play-circle" style={{ width: 72, height: 72, boxShadow: '0 4px 24px rgba(0,0,0,.4)' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 4 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="featured-sermon-info">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,150,199,.2)', borderRadius: 100, padding: '4px 14px', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 'var(--sp-2)' }}>Current Series</div>
              <h2 className="t-h2 text-white">{(featured && featured.title) || 'Anchored: Finding Stability in an Uncertain World'}</h2>
              <p style={{ color: 'rgba(255,255,255,.65)', marginTop: 'var(--sp-2)', fontSize: '.9rem', lineHeight: 1.65 }}>
                {(featured && featured.description) || 'What does it look like to stay grounded when everything around you feels uncertain? In this message, we explore the anchor that never shifts.'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'var(--sp-3)' }}>
                <div className="img-placeholder" style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" /><path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#fff' }}>{(featured && featured.speaker) || 'Oasis Christian Centre'}</div>
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)' }}>
                    {featured && featured.published_at ? new Date(featured.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'April 20, 2026'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
                <a href={featured ? `https://www.youtube.com/watch?v=${featured.youtube_id}` : '#'} target="_blank" rel="noopener" className="btn btn-primary">Watch Message</a>
                <a href={YT_CHANNEL_URL} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">More on YouTube →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-off" data-screen-label="All Messages">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
            <div>
              <p className="t-eyebrow">Library</p>
              <h2 className="t-h2 mt-1">All Messages</h2>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="text" className="form-input" placeholder="Search messages..." style={{ maxWidth: 220, padding: '10px 16px' }} />
            </div>
          </div>

          <SermonGrid sermons={sermons} />
        </div>
      </section>

      <section className="section bg-charcoal" data-screen-label="Podcast CTA">
        <div className="container text-center">
          <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>Listen Anywhere</p>
          <h2 className="t-h2 text-white mt-2" style={{ marginBottom: 'var(--sp-2)' }}>Subscribe to the Oasis Podcast</h2>
          <p style={{ color: 'rgba(255,255,255,.6)', maxWidth: 440, margin: '0 auto var(--sp-4)', fontSize: '.95rem' }}>Take the message with you. Available on Spotify, Apple Podcasts, and wherever you listen.</p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#" className="btn btn-secondary text-white" style={{ borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>Apple Podcasts</a>
            <a href="#" className="btn btn-secondary text-white" style={{ borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>Spotify</a>
            <a href={YT_CHANNEL_URL} target="_blank" rel="noopener" className="btn btn-secondary text-white" style={{ borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>YouTube</a>
          </div>
        </div>
      </section>
    </>
  );
}
