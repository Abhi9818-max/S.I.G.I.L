import ClientTierDetailPage from './ClientTierDetailPage';

type Params = { slug: string };

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

export default async function TierPage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const { slug } = params;
  return <ClientTierDetailPage slug={slug} />;
}
