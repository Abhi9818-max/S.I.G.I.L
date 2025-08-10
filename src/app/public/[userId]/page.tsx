import React from 'react';
import type { Metadata } from 'next';
import { getPublicUserData } from '@/lib/server/get-public-data';
import PublicProfileClientPage from '@/components/public/PublicProfileClient';
import { notFound } from 'next/navigation';

interface Props {
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

  const title = `${userData.username}'s Public Profile | S.I.G.I.L.`;
  const description = userData.bio || `View the public profile and contribution graph for ${userData.username} on S.I.G.I.L.`;
  const imageUrl = userData.photoURL || 'https://www.sigil.gg/default-og-image.png'; // A default OG image is good practice

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: `${userData.username}'s profile picture`,
        },
      ],
      siteName: 'S.I.G.I.L.',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  }
}

// This is now a Server Component
export default async function PublicProfilePage({ params }: Props) {
    const userId = params.userId;
    const userData = await getPublicUserData(userId);

    if (!userData) {
        notFound();
    }
    
    // Pass the server-fetched data to the client component
    return <PublicProfileClientPage initialUserData={userData} userId={userId} />;
}
