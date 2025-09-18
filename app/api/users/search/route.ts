import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

const userSummarySelect = {
  id: true,
  displayName: true,
  handle: true,
  image: true,
  bio: true,
};

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  if (query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const userId = session.user.id;

  const [pendingRequests, friendships, users] = await Promise.all([
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
    prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: {
        userAId: true,
        userBId: true,
      },
    }),
    prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { handle: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: userSummarySelect,
      take: 10,
      orderBy: [{ displayName: 'asc' }],
    }),
  ]);

  const friendsSet = new Set<string>();
  friendships.forEach((entry) => {
    const friendId = entry.userAId === userId ? entry.userBId : entry.userAId;
    friendsSet.add(friendId);
  });

  const outgoingSet = new Set<string>();
  const incomingSet = new Set<string>();

  pendingRequests.forEach((req) => {
    if (req.requesterId === userId) {
      outgoingSet.add(req.recipientId);
    }
    if (req.recipientId === userId) {
      incomingSet.add(req.requesterId);
    }
  });

  const results = users.map((user) => {
    let status: 'FRIEND' | 'PENDING' | 'INCOMING' | 'NONE' = 'NONE';

    if (friendsSet.has(user.id)) {
      status = 'FRIEND';
    } else if (outgoingSet.has(user.id)) {
      status = 'PENDING';
    } else if (incomingSet.has(user.id)) {
      status = 'INCOMING';
    }

    return {
      ...user,
      status,
    };
  });

  return NextResponse.json({ results });
}
