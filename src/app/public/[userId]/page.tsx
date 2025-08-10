
import type { Metadata } from 'next';
import { getPublicUserData } from '@/lib/server/get-public-data';
import PublicProfilePage from '@/components/public/PublicProfilePage';

type Props = {
    params: { userId: string }
}

// This function now correctly runs on the server
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const userId = params.userId;
  const userData = await getPublicUserData(userId);

  if (!userData) {
    return {
      title: 'Profile Not Found',
    }
  }

  const title = `${userData.username}'s Public Profile`;
  const description = userData.bio || `View the progress and achievements of ${userData.username} on S.I.G.I.L.`;
  const imageUrl = userData.photoURL || `${process.env.NEXT_PUBLIC_BASE_URL}/og-image.png`;

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
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  }
}


export default async function Page({ params }: Props) {
    const { userId } = params;
    const initialUserData = await getPublicUserData(userId);

    if (!initialUserData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Profile Not Found</h1>
                    <p className="text-muted-foreground">The requested user profile does not exist.</p>
                </div>
            </div>
        );
    }
    
    return <PublicProfilePage initialUserData={initialUserData} />;
}
