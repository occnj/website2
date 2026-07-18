'use client';

import { useSiteData } from './SiteDataContext';
import { safeHttpUrl } from '@/lib/safeUrl';

const FALLBACK_DONATE_URL = 'https://thekingdomledger.com/donate?code=2335';

export default function GiveLink({ className, children }) {
  const { settings } = useSiteData();
  const href = safeHttpUrl(settings && settings.donate_url, FALLBACK_DONATE_URL);
  const newTab = !settings || settings.donate_new_tab !== false;
  return (
    <a
      href={href}
      className={className}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener' : undefined}
    >
      {children}
    </a>
  );
}
