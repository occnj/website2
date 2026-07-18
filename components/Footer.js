'use client';

import Link from 'next/link';
import { useSiteData } from './SiteDataContext';
import { asset } from '@/lib/basePath';
import SocialLinks from './SocialLinks';
import GiveLink from './GiveLink';

export default function Footer() {
  const { settings } = useSiteData();
  const address = settings && settings.address;
  const serviceTime = settings && settings.service_time;
  const directionsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;

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
            {(address || serviceTime) && <p style={{ fontSize: '.82rem', opacity: .6, lineHeight: 1.6 }}>
              {address}{address && serviceTime ? <br /> : null}{serviceTime}
            </p>}
            <SocialLinks settings={settings} className="footer-social" />
          </div>
          <div className="footer-col">
            <h4>Visit</h4>
            <ul>
              <li><Link href="/plan-your-visit">Plan Your Visit</Link></li>
              <li><Link href="/plan-your-visit">Service Times</Link></li>
              {directionsUrl && <li><a href={directionsUrl} target="_blank" rel="noopener noreferrer">Directions</a></li>}
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <ul>
              <li><Link href="/about#ministries">Teams</Link></li>
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
              <li><GiveLink>Give</GiveLink></li>
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
