import './watch.css';
import PageHero from '@/components/PageHero';
import SermonGrid from '@/components/SermonGrid';
import { getPageHero, getSermons, getSiteSettings } from '@/lib/data';
import { getChannelVideos } from '@/lib/youtube';
import LivePlayer from '@/components/LivePlayer';
import LiveBanner from '@/components/LiveBanner';
import LiveInfoPanel from '@/components/LiveInfoPanel';

export const metadata = {
  title: 'Watch — Oasis Christian Centre',
  description: 'Watch messages from Oasis Christian Centre online. Every sermon, every series — available anytime.',
};
export const dynamic = 'force-dynamic';

export default async function WatchPage() {
  // Everything on this page comes from the Oasis YouTube channel (@OCCNJ).
  // If the feed is unreachable, fall back to sermons added in the Admin.
  const [hero, ytVideos, dbSermons, settings] = await Promise.all([
    getPageHero('watch'),
    getChannelVideos(),
    getSermons(),
    getSiteSettings(),
  ]);
  const sermons = ytVideos.length ? ytVideos : dbSermons;
  // Podcast section is hidden by default; enable it in Admin → Settings
  // by setting `podcast_enabled` to true once the show is live.
  const podcastEnabled = !!(settings && settings.podcast_enabled);

  return (
    <>
      <PageHero
        eyebrow="Messages & Media"
        title={(hero && hero.title) || 'Watch'}
        description={(hero && hero.intro) || 'Every message, every series — available anytime. Watch online or join us live every Sunday at 10 AM.'}
        image={hero && hero.image}
      />

      <LiveBanner />

      <section className="section" data-screen-label="Watch Now Live">
        <div className="container">
          <div className="section-label">
            <p className="t-eyebrow">Watch Now Live</p>
          </div>
          <div className="featured-sermon">
            <div className="featured-sermon-video" data-live-player>
              <LivePlayer
                twitch_channel={(settings && settings.twitch_channel) || 'occnj'}
                youtube_channel={(settings && settings.youtube_channel) || ''}
                facebook_page_id={(settings && settings.facebook_page_id) || ''}
                live_default_tab={(settings && settings.live_default_tab) || 'twitch'}
              />
            </div>
            <LiveInfoPanel />
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

      {podcastEnabled && (
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
      )}
    </>
  );
}
