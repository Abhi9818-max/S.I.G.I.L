import ClientTierDetailPage from './ClientTierDetailPage';

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  // Replace with your actual tier slugs from TIER_INFO
  const tierSlugs = [
    'novice',
    'apprentice', 
    'journeyman',
    'expert',
    'master',
    'grandmaster'
  ];
  
  return tierSlugs.map(slug => ({ slug }));
}

export default async function TierPage({ params }: { params: Params }) {
  const { slug } = await params;
  return <ClientTierDetailPage slug={slug} />;
}
