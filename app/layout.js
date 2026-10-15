import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CmsBridge from '@/components/CmsBridge';
import ClosureBanner from '@/components/ClosureBanner';
import { SiteDataProvider } from '@/components/SiteDataContext';
import ScrollRestorer from '@/components/ScrollRestorer';
import { getSiteSettings, getNavItems } from '@/lib/data';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://oasisnj.net'),
  title: 'Oasis Christian Centre — Rahway, NJ',
  description: 'Know God, Find Hope, Make a Difference. Join us Sundays at 10AM in Rahway, NJ.',
  icons: {
    icon: [{ url: '/uploads/logo-1776793086472.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/uploads/logo-1776793086472.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Oasis Christian Centre',
    title: 'Oasis Christian Centre — Rahway, NJ',
    description: 'Know God, Find Hope, Make a Difference.',
  },
};

export const dynamic = 'force-dynamic';

// Runs before the first paint: decides whether the header is floating or solid
// (class `hdr-solid` on <html>) and keeps it in step with scrolling, with
// separate on/off thresholds so iOS rubber-banding can't make it flicker.
// `hdr-instant` suppresses the fade while the page loads/restores its position.
const HEADER_STATE_SCRIPT = `(function(){var d=document.documentElement;
function u(){var y=window.scrollY||0,s=d.classList.contains('hdr-solid');if(s?y<=8:y>32)d.classList.toggle('hdr-solid',!s);}
d.classList.add('hdr-instant');u();
addEventListener('scroll',u,{passive:true});addEventListener('pageshow',u);
addEventListener('load',function(){u();setTimeout(function(){d.classList.remove('hdr-instant');},300);});})();`;

export default async function RootLayout({ children }) {
  const [settings, navItems] = await Promise.all([getSiteSettings(), getNavItems()]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEADER_STATE_SCRIPT }} />
      </head>
      <body>
        <SiteDataProvider settings={settings} navItems={navItems}>
          <Header />
          <ClosureBanner />
          {children}
          <Footer />
        </SiteDataProvider>
        <CmsBridge />
        <ScrollRestorer />
      </body>
    </html>
  );
}
