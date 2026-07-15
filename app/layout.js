import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CmsBridge from '@/components/CmsBridge';
import { SiteDataProvider } from '@/components/SiteDataContext';
import { getSiteSettings, getNavItems } from '@/lib/data';

export const metadata = {
  title: 'Oasis Christian Centre — Rahway, NJ',
  description: 'Know God, Find Hope, Make a Difference. Join us Sundays at 10AM in Rahway, NJ.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const [settings, navItems] = await Promise.all([getSiteSettings(), getNavItems()]);

  return (
    <html lang="en">
      <body>
        <SiteDataProvider settings={settings} navItems={navItems}>
          <Header />
          {children}
          <Footer />
        </SiteDataProvider>
        <CmsBridge />
      </body>
    </html>
  );
}
