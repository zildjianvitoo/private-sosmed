import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { FriendsDashboard } from '@/components/friends/friends-dashboard';

const userSummarySelect = {
  id: true,
  displayName: true,
  handle: true,
  image: true,
  bio: true,
};

export default async function FriendsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [incoming, outgoing, friendships, pendingIds, suggestions] = await prisma.$transaction([
    prisma.friendRequest.findMany({
      where: { recipientId: userId, status: 'PENDING' },
      include: { requester: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendRequest.findMany({
      where: { requesterId: userId, status: 'PENDING' },
      include: { recipient: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: userSummarySelect },
        userB: { select: userSummarySelect },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendRequest.findMany({
      where: {
        status: 'PENDING',
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
      select: {
        requesterId: true,
        recipientId: true,
      },
    }),
    prisma.user.findMany({
      where: {
        id: { not: userId },
      },
      select: userSummarySelect,
      take: 12,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const friendIds = new Set<string>();
  const friends = friendships.map((friendship) => {
    const friend = friendship.userA.id === userId ? friendship.userB : friendship.userA;
    friendIds.add(friend.id);
    return {
      id: friend.id,
      displayName: friend.displayName,
      handle: friend.handle,
      image: friend.image,
      bio: friend.bio,
      since: friendship.createdAt.toISOString(),
    };
  });

  const outgoingSet = new Set<string>();
  const incomingSet = new Set<string>();
  pendingIds.forEach((req) => {
    if (req.requesterId === userId) outgoingSet.add(req.recipientId);
    if (req.recipientId === userId) incomingSet.add(req.requesterId);
  });

  const suggestionResults = suggestions
    .filter(
      (user) => !friendIds.has(user.id) && !outgoingSet.has(user.id) && !incomingSet.has(user.id),
    )
    .slice(0, 6)
    .map((user) => ({
      ...user,
      status: 'NONE' as const,
    }));

  const incomingRequests = incoming.map((request) => ({
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    requester: request.requester,
  }));

  const outgoingRequests = outgoing.map((request) => ({
    id: request.id,
    createdAt: request.createdAt.toISOString(),
    recipient: request.recipient,
  }));

  return (
    <FriendsDashboard
      currentUser={{
        id: userId,
        displayName: session.user.name ?? 'Member',
        handle: session.user.handle ?? null,
      }}
      initialFriends={friends}
      initialIncoming={incomingRequests}
      initialOutgoing={outgoingRequests}
      initialSuggestions={suggestionResults}
    />
  );
}
