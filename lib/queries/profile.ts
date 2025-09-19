import prisma from '@/lib/prisma';

const profileUserSelect = {
  id: true,
  displayName: true,
  handle: true,
  bio: true,
  image: true,
  createdAt: true,
  photos: {
    orderBy: { createdAt: 'desc' },
    take: 9,
    select: {
      id: true,
      caption: true,
      filePath: true,
      createdAt: true,
    },
  },
};

const friendSummarySelect = {
  id: true,
  displayName: true,
  handle: true,
  image: true,
};

export interface ProfileOverviewData {
  user: {
    id: string;
    displayName: string;
    handle: string | null;
    bio: string | null;
    image: string | null;
    createdAt: Date;
    photos: Array<{
      id: string;
      caption: string | null;
      filePath: string;
      createdAt: Date;
    }>;
  };
  friends: Array<{
    id: string;
    displayName: string;
    handle: string | null;
    image: string | null;
    since: Date;
  }>;
  totalPhotos: number;
}

export async function getProfileOverviewData(userId: string): Promise<ProfileOverviewData | null> {
  const [user, friendships, photoCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: profileUserSelect,
    }),
    prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: friendSummarySelect },
        userB: { select: friendSummarySelect },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.photo.count({ where: { ownerId: userId } }),
  ]);

  if (!user) {
    return null;
  }

  const friends = friendships.map((friendship) => {
    const friend = friendship.userA.id === userId ? friendship.userB : friendship.userA;
    return {
      id: friend.id,
      displayName: friend.displayName,
      handle: friend.handle,
      image: friend.image,
      since: friendship.createdAt,
    };
  });

  return {
    user,
    friends,
    totalPhotos: photoCount,
  };
}
