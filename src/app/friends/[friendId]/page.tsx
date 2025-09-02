import ClientFriendProfilePage from './ClientFriendProfilePage';

type Params = { friendId: string };

export async function generateStaticParams() {
  // This page is dynamic, so we return an empty array.
  // Next.js will then generate pages on-demand.
  return [];
}

export default async function FriendPage({ params }: { params: Promise<Params> }) {
  const { friendId } = await params;
  return <ClientFriendProfilePage friendId={friendId} />;
}
