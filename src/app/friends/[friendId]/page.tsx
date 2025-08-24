import ClientFriendProfilePage from './ClientFriendProfilePage';

export async function generateStaticParams() {
  // Replace with actual friend ID fetching logic
  const friendIds = ['friend1', 'friend2', 'friend3'];
  return friendIds.map(friendId => ({ friendId }));
}

export default function FriendPage({ params }: { params: { friendId: string } }) {
  return <ClientFriendProfilePage friendId={params.friendId} />;
}
