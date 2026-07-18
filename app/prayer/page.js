import '../contact/contact.css';
import PageHero from '@/components/PageHero';
import PrayerForm from '@/components/PrayerForm';
import { getPageHero } from '@/lib/data';

export const metadata = {
  title: 'Prayer Request — Oasis Christian Centre',
  description: 'Submit a prayer request. Our dedicated prayer team will stand with you and personally pray over your situation.',
};
export const dynamic = 'force-dynamic';

export default async function PrayerPage() {
  const hero = await getPageHero('prayer');

  return (
    <>
      <PageHero
        eyebrow="Care & Prayer"
        title={(hero && hero.title) || 'We&rsquo;re Standing With You'}
        description={(hero && hero.intro) || 'Whatever you\u2019re walking through, you don\u2019t have to carry it alone. Submit a request and our prayer team will personally lift you up.'}
        image={hero && hero.image}
      />

      <section className="section" data-screen-label="Prayer Form">
        <div className="container" style={{ maxWidth: 680 }}>
          <PrayerForm />
        </div>
      </section>
    </>
  );
}
