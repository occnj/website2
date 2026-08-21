'use client';

import { useEffect, useRef, useState } from 'react';
import { useSiteData } from './SiteDataContext';

const DISMISSED_KEY = 'oasis-promotional-popup-dismissed';

export function safePopupHref(value) {
  const href = String(value || '').trim();
  if (!href) return '';
  if (/^(https?:|mailto:|tel:)/i.test(href) || href.startsWith('/') || href.startsWith('#')) return href;
  return '';
}

export function normalizePopupSettings(settings) {
  const source = settings || {};
  const accent = /^#[0-9a-f]{6}$/i.test(source.popup_accent_color || '')
    ? source.popup_accent_color
    : '#00A4CC';

  return {
    enabled: Boolean(source.popup_enabled),
    eyebrow: String(source.popup_eyebrow || '').trim(),
    title: String(source.popup_title || '').trim(),
    description: String(source.popup_description || '').trim(),
    imageUrl: safePopupHref(source.popup_image_url),
    primaryLabel: String(source.popup_primary_label || '').trim(),
    primaryUrl: safePopupHref(source.popup_primary_url),
    secondaryLabel: String(source.popup_secondary_label || '').trim(),
    secondaryUrl: safePopupHref(source.popup_secondary_url),
    accent,
    delaySeconds: Math.min(30, Math.max(0, Number(source.popup_delay_seconds) || 0)),
  };
}

export default function PromotionalPopup() {
  const { settings } = useSiteData();
  const popup = normalizePopupSettings(settings);
  const [open, setOpen] = useState(false);
  const closeButton = useRef(null);

  useEffect(() => {
    if (!popup.enabled || !popup.title || window.location.pathname.startsWith('/admin')) return undefined;

    try {
      if (window.sessionStorage.getItem(DISMISSED_KEY) === '1') return undefined;
    } catch {
      // Storage can be unavailable in strict privacy modes; the popup still works.
    }

    const timer = window.setTimeout(() => setOpen(true), popup.delaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [popup.delaySeconds, popup.enabled, popup.title]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  });

  function dismiss() {
    try { window.sessionStorage.setItem(DISMISSED_KEY, '1'); } catch {}
    setOpen(false);
  }

  if (!open) return null;

  const hasImage = Boolean(popup.imageUrl);
  const primaryExternal = /^https?:/i.test(popup.primaryUrl);
  const secondaryExternal = /^https?:/i.test(popup.secondaryUrl);

  return (
    <div className="promo-popup-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <section
        className={`promo-popup-card${hasImage ? ' has-image' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-title"
        style={{ '--promo-accent': popup.accent }}
      >
        <button ref={closeButton} type="button" className="promo-popup-close" onClick={dismiss} aria-label="Close message">×</button>

        <div className="promo-popup-copy">
          {popup.eyebrow ? <div className="promo-popup-eyebrow">{popup.eyebrow}</div> : null}
          <h2 id="promo-popup-title">{popup.title}</h2>
          {popup.description ? <p>{popup.description}</p> : null}
          {(popup.primaryLabel && popup.primaryUrl) || (popup.secondaryLabel && popup.secondaryUrl) ? (
            <div className="promo-popup-actions">
              {popup.primaryLabel && popup.primaryUrl ? (
                <a href={popup.primaryUrl} className="promo-popup-primary" target={primaryExternal ? '_blank' : undefined} rel={primaryExternal ? 'noopener noreferrer' : undefined} onClick={dismiss}>
                  {popup.primaryLabel} <span aria-hidden="true">→</span>
                </a>
              ) : null}
              {popup.secondaryLabel && popup.secondaryUrl ? (
                <a href={popup.secondaryUrl} className="promo-popup-secondary" target={secondaryExternal ? '_blank' : undefined} rel={secondaryExternal ? 'noopener noreferrer' : undefined} onClick={dismiss}>
                  {popup.secondaryLabel}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        {hasImage ? (
          <div className="promo-popup-media">
            <img src={popup.imageUrl} alt="" />
            <div className="promo-popup-media-shade" />
          </div>
        ) : null}
      </section>
    </div>
  );
}
