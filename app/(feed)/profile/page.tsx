import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [user, friendships, photoCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
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
      },
    }),
    prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            image: true,
          },
        },
        userB: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.photo.count({
      where: { ownerId: userId },
    }),
  ]);

  if (!user) {
    redirect('/login');
  }

  const resolveImageSrc = (path: string | null) =>
    path ? (path.startsWith('/') ? path : `/${path}`) : null;

  const friends = friendships.map((friendship) => {
    const friend = friendship.userA.id === userId ? friendship.userB : friendship.userA;
    return {
      id: friend.id,
      displayName: friend.displayName,
      handle: friend.handle,
      image: resolveImageSrc(friend.image),
    };
  });

  const friendCount = friends.length;
  const displayedFriends = friends.slice(0, 6);
  const hasMoreFriends = friendCount > displayedFriends.length;

  const initials =
    user.displayName
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SP';

  const avatarSrc = resolveImageSrc(user.image);
  const handleLabel = user.handle ? `@${user.handle}` : null;
  const joinedLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(user.createdAt);

  const totalPhotos = photoCount;
  const hasPhotos = user.photos.length > 0;
  const missingSlots = Math.max(0, 9 - user.photos.length);
  const getPhotoUrl = (filePath: string) => (filePath.startsWith('/') ? filePath : `/${filePath}`);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <Card className="overflow-hidden">
        <CardHeader className="gap-6 items-start sm:flex sm:flex-row sm:items-center sm:gap-8">
          <Avatar className="h-20 w-20 border border-border/60 shadow-sm">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt={user.displayName} />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 space-y-2">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground">
                {user.displayName}
              </CardTitle>
              {handleLabel && <CardDescription>{handleLabel}</CardDescription>}
            </div>
            {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-muted-foreground">
              <span>Joined {joinedLabel}</span>
              <span aria-hidden="true">•</span>
              <span>
                {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
              </span>
              <span aria-hidden="true">•</span>
              <span>
                {totalPhotos} {totalPhotos === 1 ? 'photo' : 'photos'}
              </span>
            </div>
          </div>
          <div className="pt-4 sm:pt-0">
            <Button asChild variant="outline">
              <Link href="/settings">Edit profile</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
            <CardDescription>The people you&apos;re connected with.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayedFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven&apos;t connected with anyone yet. Head to the friends tab to discover
                people you may know.
              </p>
            ) : (
              <div className="grid gap-4">
                {displayedFriends.map((friend) => {
                  const friendInitials =
                    friend.displayName
                      .split(' ')
                      .map((part) => part.charAt(0))
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'SP';

                  return (
                    <div key={friend.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {friend.image ? (
                            <AvatarImage src={friend.image} alt={friend.displayName} />
                          ) : (
                            <AvatarFallback>{friendInitials}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {friend.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {friend.handle ? `@${friend.handle}` : 'No handle yet'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Friend</Badge>
                    </div>
                  );
                })}
              </div>
            )}
            {hasMoreFriends && (
              <Button asChild variant="ghost" className="w-full justify-start text-sm">
                <Link href="/friends">View all friends</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Your latest uploads in a 3 × 3 grid.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasPhotos ? (
              <div className="grid grid-cols-3 gap-3">
                {user.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-muted"
                  >
                    <Image
                      src={getPhotoUrl(photo.filePath)}
                      alt={photo.caption ?? 'Uploaded photo'}
                      fill
                      sizes="(min-width: 1024px) 160px, (min-width: 640px) 30vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
                {Array.from({ length: missingSlots }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground"
                  >
                    Empty
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
                No photos yet. Share your first moment from the feed composer.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
