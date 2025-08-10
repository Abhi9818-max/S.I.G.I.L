
import type { Metadata } from 'next';
import { getPublicUserData } from '@/lib/server/get-public-data';
import PublicProfileClientPage from '@/components/public/PublicProfileClientPage';
import { notFound } from 'next/navigation';

type Props = {
    params: { userId: string }
}

// This function now correctly runs on the server
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const userId = params.userId;
  const userData = await getPublicUserData(userId);
  
  const title = userData ? `${userData.username}'s Profile on S.I.G.I.L.` : 'S.I.G.I.L. Profile';
  const description = userData?.bio || 'View this user\'s progress and achievements on S.I.G.I.L.';
  const imageUrl = userData?.photoURL || `https://placehold.co/1200x630.png`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${userData?.username || 'User'}'s profile picture`,
        },
      ],
      type: 'profile',
      profile: {
          username: userData?.username
      },
      url: `/public/${userId}`,
      siteName: 'S.I.G.I.L.'
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

// This is now a Server Component
export default async function PublicProfilePage({ params }: Props) {
    const userData = await getPublicUserData(params.userId);

    if (!userData) {
        notFound();
    }

    return <PublicProfileClientPage initialUserData={userData} />;
}
