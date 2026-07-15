'use client';

import Link from 'next/link';
import { useSiteData } from './SiteDataContext';
import { asset } from '@/lib/basePath';

export default function Footer() {
  const { settings } = useSiteData();
  const phone = (settings && settings.phone) || '(732) 555-0100';
  const address = (settings && settings.address) || '15 Main St, Rahway, NJ 07065';
  const serviceTime = (settings && settings.service_time) || 'Sunday Service: 10:00 AM';

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={asset('/uploads/logo-1776793086472.png')} alt="Oasis" />
              <span className="footer-logo-text">Oasis Christian Centre</span>
            </div>
            <p className="footer-tagline">{(settings && settings.tagline) || 'Know God. Find Hope. Make a Difference.'}</p>
            <p style={{ fontSize: '.82rem', opacity: .6, lineHeight: 1.6 }}>
              {address}<br />
              {serviceTime}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {['fb', 'ig', 'yt'].map((k) => (
                <a
                  key={k}
                  href="#"
                  style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,.1)', display: 'grid', placeItems: 'center', fontSize: '.8rem', opacity: .7, transition: 'opacity .15s' }}
                >
                  {k}
                </a>
              ))}
            </div>
          </div>
          <div className="footer-col">
            <h4>Visit</h4>
            <ul>
              <li><Link href="/plan-your-visit">Plan Your Visit</Link></li>
              <li><Link href="/plan-your-visit">Service Times</Link></li>
              <li><a href="https://maps.google.com/?q=Oasis+Christian+Centre+Rahway+NJ" target="_blank" rel="noopener">Directions</a></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <ul>
              <li><Link href="/about#ministries">Teams</Link></li>
              <li><Link href="/#circles">Circles</Link></li>
              <li><Link href="/contact">Prayer Request</Link></li>
              <li><Link href="/life-events">Life Events</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><Link href="/watch">Watch Messages</Link></li>
              <li><Link href="/events">Events</Link></li>
              <li><Link href="/leadership">Leadership</Link></li>
              <li><Link href="/give">Give</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Oasis Christian Centre, Rahway, NJ. All rights reserved.</span>
          <span>Built with care for the community.</span>
        </div>
      </div>
    </footer>
  );
}
