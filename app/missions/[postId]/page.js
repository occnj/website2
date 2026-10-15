import { notFound } from 'next/navigation';
import MinistryPostPage, { generateMetadata as ministryPostMetadata } from '../../ministries/[slug]/[postId]/page';
import { getMissionsMinistry } from '@/lib/data';

// A Mission Blog post: the Missions ministry's post page, at /missions/<post>.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { postId } = await params;
  const ministry = await getMissionsMinistry();
  if (!ministry) return {};
  return ministryPostMetadata({ params: { slug: ministry.slug, postId } });
}

export default async function MissionPostPage({ params }) {
  const { postId } = await params;
  const ministry = await getMissionsMinistry();
  if (!ministry) notFound();
  return MinistryPostPage({ params: { slug: ministry.slug, postId, missionBlog: true } });
}
