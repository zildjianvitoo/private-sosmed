import type { Prisma } from '@prisma/client';

import type { FeedPhoto } from '@/lib/api/photos';
import { formatRelativeTime } from '@/lib/time';
import { getAppBaseUrl } from '@/lib/url';

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
  const baseUrl = getAppBaseUrl().replace(/\/$/, '');

  return {
    id: photo.id,
    caption: photo.caption,
    filePath: photo.filePath,
    fileUrl: `${baseUrl}/${photo.filePath}`,
    createdAt: photo.createdAt.toISOString(),
    relativeCreatedAt: `${formatRelativeTime(photo.createdAt)} ago`,
    owner: photo.owner,
  };
}
