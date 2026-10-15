import MinistryPostPage, { generateMetadata as ministryPostMetadata } from '../../ministries/[slug]/[postId]/page';

// A Mission Blog post: the "missions" ministry's post page, at /missions/<post>.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { postId } = await params;
  return ministryPostMetadata({ params: { slug: 'missions', postId } });
}

export default async function MissionPostPage({ params }) {
  const { postId } = await params;
  return MinistryPostPage({ params: { slug: 'missions', postId } });
}
