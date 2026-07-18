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
            <div className="footer-social">
              <a href={(settings && settings.facebook_url) || '#'} aria-label="Facebook" target="_blank" rel="noopener">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.7-1.6h1.5V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.7H7.7V14h2.8v8h3z" /></svg>
              </a>
              <a href={(settings && settings.instagram_url) || '#'} aria-label="Instagram" target="_blank" rel="noopener">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="https://www.youtube.com/@OCCNJ" aria-label="YouTube" target="_blank" rel="noopener">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.5s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.4-1C16.4 4 12 4 12 4s-4.4 0-7.7.2c-.5.1-1.5.1-2.4 1-.7.7-.9 2.3-.9 2.3S.8 9.4.8 11.3v1.4c0 1.9.2 3.8.2 3.8s.2 1.6.9 2.3c.9.9 2 .9 2.5 1 1.9.2 7.6.2 7.6.2s4.4 0 7.7-.2c.5-.1 1.5-.1 2.4-1 .7-.7.9-2.3.9-2.3s.2-1.9.2-3.8v-1.4c0-1.9-.2-3.8-.2-3.8zM9.7 15.3V8.7l6.2 3.3-6.2 3.3z" /></svg>
              </a>
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
              <li><Link href="/prayer">Prayer Request</Link></li>
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
