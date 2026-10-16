import Link from 'next/link';

// Ministry cards with a photo (or the ministry's colour) behind white text —
// used on /ministries and on the About page so both look the same.
// Styles: app/ministries/ministries.css (.ministry-card-overlay …).

const HEX = /^#[0-9a-f]{6}$/i;

export function ministryHref(m) {
  return m.slug === 'missions' ? '/missions' : `/ministries/${m.slug}`;
}

export default function MinistryCards({ ministries, showDescription = false }) {
  if (!ministries || !ministries.length) return null;
  return (
    <div className="ministry-cards-grid">
      {ministries.map((m) => {
        // The gradient appends alpha to the colour, so it must be a 6-digit hex.
        const overlay = HEX.test(m.overlay_color || '') ? m.overlay_color : '#1A2835';
        return (
          <Link
            key={m.id}
            href={ministryHref(m)}
            className={'ministry-card-overlay' + (showDescription ? ' has-desc' : '')}
            style={!m.image_url ? { background: overlay } : undefined}
          >
            {m.image_url && <img className="ministry-card-bg" src={m.image_url} alt={m.name} />}
            <div
              className="ministry-card-gradient"
              style={{ background: `linear-gradient(to top, ${overlay}ee 0%, ${overlay}88 45%, ${overlay}22 100%)` }}
            />
            <div className="ministry-card-body">
              <p className="ministry-card-name">{m.name}</p>
              {showDescription && m.description ? <p className="ministry-card-desc">{m.description}</p> : null}
              <span className="ministry-card-cta">Blog &amp; Updates →</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
