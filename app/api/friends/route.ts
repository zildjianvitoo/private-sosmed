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

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: userSummarySelect },
      userB: { select: userSummarySelect },
    },
    orderBy: { createdAt: 'desc' },
  });

  const friends = friendships.map((friendship) => {
    const friend = friendship.userA.id === userId ? friendship.userB : friendship.userA;
    return {
      id: friend.id,
      displayName: friend.displayName,
      handle: friend.handle,
      image: friend.image,
      bio: friend.bio,
      since: friendship.createdAt,
    };
  });

  return NextResponse.json({ friends });
}
