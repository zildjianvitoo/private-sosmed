'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useMemo } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchPhotos, FeedPageData, FeedPhoto } from '@/lib/api/photos';

interface FeedTimelineProps {
  initialPage: FeedPageData;
}

export function FeedTimeline({ initialPage }: FeedTimelineProps) {
  const query = useInfiniteQuery({
    queryKey: ['photos'],
    queryFn: ({ pageParam }: { pageParam?: string }) => fetchPhotos(pageParam),
    initialData: {
      pageParams: [undefined],
      pages: [initialPage],
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const photos = useMemo(
    () => query.data?.pages.flatMap((page) => page.photos) ?? [],
    [query.data?.pages],
  );

  return (
    <div className="space-y-6">
      {photos.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No uploads yet</CardTitle>
            <CardDescription>
              Share a moment to see it appear in your feed instantly.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {photos.map((photo) => {
        const initials = photo.owner.displayName
          .split(' ')
          .map((part) => part.charAt(0))
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return (
          <Card key={photo.id} className="overflow-hidden p-0">
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  {photo.owner.image ? (
                    <AvatarImage src={photo.owner.image} alt={photo.owner.displayName} />
                  ) : (
                    <AvatarFallback>{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/profile/${photo.owner.id}`}
                      className="text-sm font-semibold text-foreground"
                    >
                      {photo.owner.displayName}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {photo.owner.handle ?? '@member'}
                    </span>
                  </div>
                  {photo.caption && (
                    <p className="text-sm leading-relaxed text-foreground/90">{photo.caption}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={photo.fileUrl}
                alt={photo.caption ?? 'Uploaded photo'}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 720px, 100vw"
              />
            </div>
            <CardFooter className="p-6">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <button className="flex items-center gap-2 font-medium text-foreground transition hover:text-primary">
                  <Heart className="h-4 w-4" /> 0
                </button>
                <button className="flex items-center gap-2 transition hover:text-primary">
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-2 transition hover:text-primary">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              <Badge variant="muted">{photo.relativeCreatedAt}</Badge>
            </CardFooter>
          </Card>
        );
      })}

      {query.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="soft"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
