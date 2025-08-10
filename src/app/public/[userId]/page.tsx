
import React from 'react';
import type { Metadata } from 'next';
import { getPublicUserData } from '@/lib/server/get-public-data';
import PublicProfileClient from '@/components/public/PublicProfileClientPage';
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
      title: 'User Not Found',
    }
  }

  const title = `${userData.username}'s Public Profile | S.I.G.I.L.`;
  const description = userData.bio || `View the public profile and progress of ${userData.username}.`;
  
  return {
    title,
    description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: userData.photoURL || '/icons/icon-512x512.png',
          width: 800,
          height: 600,
          alt: `${userData.username}'s avatar`,
        },
      ],
      type: 'profile',
      profile: {
        username: userData.username,
      }
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [userData.photoURL || '/icons/icon-512x512.png'],
    },
  };
}

// This is now a Server Component
export default async function PublicProfilePage({ params }: Props) {
    const userData = await getPublicUserData(params.userId);

    if (!userData) {
        notFound();
    }

    // Render the client component, passing the server-fetched data as props
    return <PublicProfileClient initialUserData={userData} />;
}
