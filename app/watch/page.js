import './watch.css';
import PageHero from '@/components/PageHero';
import SermonGrid from '@/components/SermonGrid';
import { getPageHero, getSermons } from '@/lib/data';
import { getChannelVideos, YT_CHANNEL_URL } from '@/lib/youtube';
import TwitchEmbed, { TWITCH_CHANNEL_URL } from '@/components/TwitchEmbed';

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
            <a href={TWITCH_CHANNEL_URL} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">Join the Stream →</a>
          </div>
        </div>
      </div>

      <section className="section" data-screen-label="Watch Now Live">
        <div className="container">
          <div className="section-label">
            <p className="t-eyebrow">Watch Now Live</p>
          </div>
          <div className="featured-sermon">
            <div className="featured-sermon-video" data-live-player>
              <TwitchEmbed />
            </div>
            <div className="featured-sermon-info">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(197,48,48,.2)', borderRadius: 100, padding: '4px 14px', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#E05252', marginBottom: 'var(--sp-2)' }}>
                <span className="live-dot"></span>Live Stream
              </div>
              <h2 className="t-h2 text-white">Watch Now Live</h2>
              <p style={{ color: 'rgba(255,255,255,.65)', marginTop: 'var(--sp-2)', fontSize: '.9rem', lineHeight: 1.65 }}>
                Join us for our live stream every Sunday morning at 10:00 AM EST. If the player doesn&rsquo;t load automatically, please refresh the page.
              </p>
              <p style={{ color: 'rgba(255,255,255,.5)', marginTop: 'var(--sp-2)', fontSize: '.82rem', lineHeight: 1.6 }}>
                On mobile devices, press play to begin the stream after 10:00 AM EST.
              </p>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)', flexWrap: 'wrap' }}>
                <a href={TWITCH_CHANNEL_URL} target="_blank" rel="noopener" className="btn btn-primary">Watch on Twitch</a>
                <a href={YT_CHANNEL_URL} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">Past Messages on YouTube →</a>
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
