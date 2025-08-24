import ClientFriendProfilePage from './ClientFriendProfilePage';

type Params = Promise<{ friendId: string }>;

export async function generateStaticParams() {
  // Replace with actual friend ID fetching logic
  const friendIds = ['friend1', 'friend2', 'friend3'];
  return friendIds.map(friendId => ({ friendId }));
}

export default async function FriendPage({ params }: { params: Params }) {
  const { friendId } = await params;
  return <ClientFriendProfilePage friendId={friendId} />;
}
