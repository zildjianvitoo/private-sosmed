import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { auth } from '@/auth';
import prisma, { getPhotoClient } from '@/lib/prisma';
import { PostComposer } from '@/components/feed/post-composer';
import { FeedTimeline } from '@/components/feed/feed-timeline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { serializePhoto, photoUserSelect } from '@/lib/serializers/photo';

const trendingTopics = [
  { title: '#twilightsessions', volume: '18.4K posts' },
  { title: '#glassandsteel', volume: '12.1K posts' },
  { title: '#afterhours', volume: '9.9K posts' },
];

const PAGE_SIZE = 9;

export default async function FeedPage() {
  const session = await auth();
  const user = session?.user ?? null;
  const displayName = user?.name ?? 'Explorer';
  const firstName = displayName.split(' ')[0] ?? displayName;
  const initials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const photoClient = getPhotoClient();
  const photos = await photoClient.findMany({
    take: PAGE_SIZE + 1,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: photoUserSelect },
    },
  });

  let nextCursor: string | null = null;
  if (photos.length > PAGE_SIZE) {
    const nextItem = photos.pop();
    nextCursor = nextItem?.id ?? null;
  }

  const initialPage = {
    photos: photos.map(serializePhoto),
    nextCursor,
  };

  let suggestions: Array<{
    id: string;
    displayName: string;
    handle: string | null;
    image: string | null;
    bio: string | null;
    mutualCount: number;
  }> = [];

  if (user?.id) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }],
      },
      select: {
        userAId: true,
        userBId: true,
      },
    });

    const friendIds = new Set<string>();
    friendships.forEach((friendship) => {
      const friendId = friendship.userAId === user.id ? friendship.userBId : friendship.userAId;
      friendIds.add(friendId);
    });

    const candidateUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: [user.id, ...Array.from(friendIds)],
        },
      },
      select: {
        id: true,
        displayName: true,
        handle: true,
        image: true,
        bio: true,
        friendshipsA: {
          select: {
            userBId: true,
          },
        },
        friendshipsB: {
          select: {
            userAId: true,
          },
        },
      },
      take: 25,
    });

    suggestions = candidateUsers
      .map((candidate) => {
        const candidateFriends = new Set<string>();
        candidate.friendshipsA.forEach((f) => candidateFriends.add(f.userBId));
        candidate.friendshipsB.forEach((f) => candidateFriends.add(f.userAId));

        let mutualCount = 0;
        candidateFriends.forEach((friendId) => {
          if (friendIds.has(friendId)) {
            mutualCount += 1;
          }
        });

        return {
          id: candidate.id,
          displayName: candidate.displayName,
          handle: candidate.handle,
          image: candidate.image,
          bio: candidate.bio,
          mutualCount,
        };
      })
      .filter((candidate) => candidate.mutualCount > 0)
      .sort((a, b) => {
        if (b.mutualCount !== a.mutualCount) {
          return b.mutualCount - a.mutualCount;
        }
        return a.displayName.localeCompare(b.displayName);
      })
      .slice(0, 3);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <Card className="bg-gradient-to-br from-primary/15 via-background to-background">
          <CardHeader className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-primary/40">
                  {user?.image ? (
                    <AvatarImage src={user.image} alt={displayName} />
                  ) : (
                    <AvatarFallback>{initials || 'SP'}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-xl">Welcome back, {firstName}</CardTitle>
                  <CardDescription>
                    Share a moment with your circle or discover what friends captured today.
                  </CardDescription>
                </div>
              </div>
              <Button variant="soft" className="sm:min-w-[140px] whitespace-nowrap" type="button">
                <Sparkles className="mr-2 h-4 w-4" /> Inspire me
              </Button>
            </div>
            <PostComposer
              currentUser={
                user
                  ? {
                      id: user.id,
                      displayName: displayName,
                      handle: user.handle ?? null,
                      image: user.image ?? null,
                    }
                  : null
              }
            />
          </CardHeader>
        </Card>

        <FeedTimeline initialPage={initialPage} />
      </div>

      <aside className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Suggested connections</CardTitle>
            <CardDescription>Creators you might know or admire.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Invite friends to get personalised suggestions.
              </p>
            )}
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {suggestion.image ? (
                      <AvatarImage src={suggestion.image} alt={suggestion.displayName} />
                    ) : (
                      <AvatarFallback>
                        {suggestion.displayName
                          .split(' ')
                          .map((part) => part.charAt(0))
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">
                      {suggestion.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.handle ?? 'Private profile'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.mutualCount} mutual connection
                      {suggestion.mutualCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/friends">Add friend</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/60 to-background">
          <CardHeader>
            <CardTitle>Trending topics</CardTitle>
            <CardDescription>Catch up with what the community is talking about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trendingTopics.map((topic) => (
              <div key={topic.title} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{topic.title}</p>
                  <p className="text-xs text-muted-foreground">{topic.volume}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-sm">
                  Follow
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
