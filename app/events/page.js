import Link from 'next/link';
import './events.css';
import PageHero from '@/components/PageHero';
import EventsList from '@/components/EventsList';
import MiniCalendar from '@/components/MiniCalendar';
import { getPageHero, getUpcomingEvents, getSiteSettings } from '@/lib/data';
import { safeHttpUrl } from '@/lib/safeUrl';
import { LifeEventsContent } from '../life-events/page';

export const metadata = { title: 'Events & Life Events — Oasis Christian Centre', description: 'See upcoming gatherings and learn how Oasis supports baptism, dedication, marriage, memorials, and other life milestones.' };
export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const [hero, events, settings] = await Promise.all([getPageHero('events'), getUpcomingEvents(), getSiteSettings()]);
  const featured = events.find((e) => e.featured);
  const featuredUrl = safeHttpUrl(featured && featured.registration_url);
  const calendarUrl = safeHttpUrl(settings && settings.calendar_url);

  return (
    <>
      <PageHero
        eyebrow="What's Happening"
        title={(hero && hero.title) || 'Events'}
        description={(hero && hero.intro) || "From Sunday services to community gatherings — there's always something happening at Oasis."}
        image={hero && hero.image}
      />

      <nav className="event-type-nav" aria-label="Events page sections">
        <div className="container event-type-grid">
          <a href="#upcoming-events">
            <strong>Upcoming Events</strong>
            <span>Scheduled services, gatherings, and community events</span>
          </a>
          <a href="#life-events">
            <strong>Life Events</strong>
            <span>Personal milestones and pastoral care</span>
          </a>
        </div>
      </nav>

      <section className="section" id="upcoming-events" data-screen-label="Upcoming Events">
        <div className="container">
          {/* Featured Event — only shown when an event is flagged "featured" in the Admin */}
          {featured && (
          <div className="featured-event">
            <div className="featured-event-img img-placeholder img-placeholder-dark">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="6" y="8" width="36" height="32" rx="4" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" /><rect x="6" y="8" width="36" height="10" rx="4" fill="rgba(255,255,255,.07)" /><path d="M16 4v8M32 4v8" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span>Featured event banner photo</span>
            </div>
            <div className="featured-event-body">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,136,58,.2)', borderRadius: 100, padding: '4px 14px', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: 'var(--sp-2)' }}>Featured Event</div>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 'var(--sp-2)' }}>
                  {featured.title}
                </h2>
                <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem', lineHeight: 1.65 }}>
                  {featured.description}
                </p>
                <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-3)', fontSize: '.82rem', color: 'rgba(255,255,255,.55)', flexWrap: 'wrap' }}>
                  <span>{new Date(featured.starts_at + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  {featured.time_label ? (<><span>·</span><span>{featured.time_label}</span></>) : null}
                  {featured.location ? (<><span>·</span><span>{featured.location}</span></>) : null}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', alignItems: 'flex-start' }}>
                {featuredUrl ? (
                  <a href={featuredUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Learn More</a>
                ) : null}
              </div>
            </div>
          </div>
          )}

          <div className="events-layout">
            <EventsList events={events} />

            <div>
              <MiniCalendar events={events} />

              <div className="sidebar-widget" style={{ background: 'var(--blue-light)', border: '1px solid rgba(0,150,199,.15)' }}>
                <h4 style={{ color: 'var(--blue-dark)' }}>Sync with Google Calendar</h4>
                <p style={{ fontSize: '.82rem', color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: 'var(--sp-2)' }}>Subscribe to the Oasis calendar to get events automatically in your phone.</p>
                {calendarUrl ? <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm full-w" style={{ justifyContent: 'center' }}>Subscribe to Calendar</a> : <p className="t-small t-muted">Calendar subscription will be available soon.</p>}
              </div>

              <div className="sidebar-widget">
                <h4>Ministry Leaders</h4>
                <p style={{ fontSize: '.82rem', color: 'var(--gray-1)', lineHeight: 1.6, marginBottom: 'var(--sp-2)' }}>Need to add an event? Submit it for approval and we&rsquo;ll get it posted.</p>
                <Link href="/contact" className="btn btn-secondary btn-sm full-w" style={{ justifyContent: 'center' }}>Submit an Event</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <LifeEventsContent embedded />
    </>
  );
}
