import { redirect } from 'next/navigation';
import { getSiteSettings } from '@/lib/data';
import { safeHttpUrl } from '@/lib/safeUrl';

export const metadata = {
  title: 'Give — Oasis Christian Centre',
  description: 'Continue to the secure external giving service used by Oasis Christian Centre.',
};
export const dynamic = 'force-dynamic';

const FALLBACK_DONATE_URL = 'https://thekingdomledger.com/donate?code=2335';

export default async function GivePage() {
  const settings = await getSiteSettings();
  const donateUrl = safeHttpUrl(settings && settings.donate_url, FALLBACK_DONATE_URL);
  redirect(donateUrl);
}
