import type { Prisma } from '@prisma/client';

import type { FeedPhoto } from '@/lib/api/photos';
import { formatRelativeTime } from '@/lib/time';

export const photoUserSelect = {
  id: true,
  displayName: true,
  handle: true,
  image: true,
  bio: true,
};

export type PhotoWithOwner = Prisma.PhotoGetPayload<{
  include: { owner: { select: typeof photoUserSelect } };
}>;

export function serializePhoto(photo: PhotoWithOwner): FeedPhoto {
  return {
    id: photo.id,
    caption: photo.caption,
    filePath: photo.filePath,
    fileUrl: `/${photo.filePath}`,
    createdAt: photo.createdAt.toISOString(),
    relativeCreatedAt: `${formatRelativeTime(photo.createdAt)} ago`,
    owner: photo.owner,
  };
}
