import Image from 'next/image';
import Link from 'next/link';

import type { ProfileOverviewData } from '@/lib/queries/profile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileOverviewProps {
  data: ProfileOverviewData;
  isSelf: boolean;
}

function resolveImage(path: string | null) {
  if (!path) {
    return null;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function initialsFromName(name: string) {
  return (
    name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SP'
  );
}

export function ProfileOverview({ data, isSelf }: ProfileOverviewProps) {
  const { user, friends, totalPhotos } = data;
  const avatarSrc = resolveImage(user.image);
  const initials = initialsFromName(user.displayName);
  const friendCount = friends.length;
  const displayedFriends = friends.slice(0, 6);
  const hasMoreFriends = friendCount > displayedFriends.length;
  const joinedLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(user.createdAt);
  const hasPhotos = user.photos.length > 0;
  const missingSlots = Math.max(0, 9 - user.photos.length);
  const firstName = user.displayName.split(' ')[0] ?? user.displayName;

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
              {user.handle && <CardDescription>@{user.handle}</CardDescription>}
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
            {isSelf ? (
              <Button asChild variant="outline">
                <Link href="/settings">Edit profile</Link>
              </Button>
            ) : (
              <Button asChild variant="soft">
                <Link href={`/friends?highlight=${user.id}`}>View connections</Link>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
            <CardDescription>
              The people {isSelf ? "you're" : `${firstName}'s`} connected with.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayedFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isSelf
                  ? "You haven't connected with anyone yet. Head to the friends tab to discover people you may know."
                  : `${firstName} hasn't connected with anyone yet.`}
              </p>
            ) : (
              <div className="grid gap-4">
                {displayedFriends.map((friend) => {
                  const friendInitials = initialsFromName(friend.displayName);
                  const friendImage = resolveImage(friend.image);

                  return (
                    <div key={friend.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {friendImage ? (
                            <AvatarImage src={friendImage} alt={friend.displayName} />
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
            <CardDescription>
              {isSelf
                ? 'Your latest uploads in a 3 × 3 grid.'
                : `Recent uploads from ${user.displayName}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPhotos ? (
              <div className="grid grid-cols-3 gap-3">
                {user.photos.map((photo) => {
                  const photoUrl = resolveImage(photo.filePath) ?? `/${photo.filePath}`;
                  return (
                    <div
                      key={photo.id}
                      className="relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-muted"
                    >
                      <Image
                        src={photoUrl}
                        alt={photo.caption ?? 'Uploaded photo'}
                        fill
                        sizes="(min-width: 1024px) 160px, (min-width: 640px) 30vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  );
                })}
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
                {isSelf
                  ? 'No photos yet. Share your first moment from the feed composer.'
                  : `${firstName} hasn't shared photos yet.`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
