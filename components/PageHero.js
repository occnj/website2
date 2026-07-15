import { asset } from '@/lib/basePath';

const DEFAULT_HERO_IMAGE = asset('/images/hero-placeholder.svg');

export default function PageHero({ eyebrow, title, description, image, imageAlt, children }) {
  return (
    <section className="page-hero" data-screen-label="Page Hero">
      <div className="page-hero-bg">
        <img src={image || DEFAULT_HERO_IMAGE} alt={imageAlt || ''} />
        <div className="page-hero-overlay" />
      </div>
      <div className="container">
        {eyebrow ? <p className="t-eyebrow" style={{ color: 'var(--amber)' }}>{eyebrow}</p> : null}
        <h1 className="t-display text-white mt-2">{title}</h1>
        {description ? <p className="page-hero-desc">{description}</p> : null}
        {children}
      </div>
    </section>
  );
}
