import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

import { auth } from '@/auth';
import prisma, { getPhotoClient } from '@/lib/prisma';
import { ensureUploadsDir, generateUploadFileName, getPublicPath } from '@/lib/uploads';
import { serializePhoto, photoUserSelect } from '@/lib/serializers/photo';
import { encodeNotificationMetadata } from '@/lib/notifications';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 9, 30);
  const cursor = searchParams.get('cursor') || undefined;

  const photoClient = getPhotoClient();
  const photos = await photoClient.findMany({
    take: limit + 1,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: photoUserSelect },
    },
  });

  let nextCursor: string | null = null;
  if (photos.length > limit) {
    const nextItem = photos.pop();
    nextCursor = nextItem?.id ?? null;
  }

  return NextResponse.json({
    photos: photos.map(serializePhoto),
    nextCursor,
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const photoClient = getPhotoClient();
  const owner = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      displayName: true,
      handle: true,
      image: true,
    },
  });

  if (!owner) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const captionRaw = formData.get('caption');
  const caption =
    typeof captionRaw === 'string' && captionRaw.trim().length > 0 ? captionRaw.trim() : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload JPEG, PNG, or WebP.' },
      { status: 415 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5MB limit.' }, { status: 413 });
  }

  const uploadDir = await ensureUploadsDir();
  const fileName = generateUploadFileName(file.name, file.type);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const diskPath = path.join(uploadDir, fileName);

  await writeFile(diskPath, buffer);

  const photo = await photoClient.create({
    data: {
      ownerId: session.user.id,
      caption,
      filePath: getPublicPath(fileName),
    },
    include: {
      owner: { select: photoUserSelect },
    },
  });

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: session.user.id }, { userBId: session.user.id }],
    },
    select: {
      userAId: true,
      userBId: true,
    },
  });

  if (friendships.length > 0) {
    const friendIds = new Set<string>();
    friendships.forEach((friendship) => {
      const friendId =
        friendship.userAId === session.user.id ? friendship.userBId : friendship.userAId;
      friendIds.add(friendId);
    });

    if (friendIds.size > 0) {
      const metadata = encodeNotificationMetadata({
        variant: 'friend_upload',
        photoId: photo.id,
        photo: {
          caption: photo.caption,
          filePath: photo.filePath,
        },
        user: {
          id: owner.id,
          displayName: owner.displayName,
          handle: owner.handle,
          image: owner.image,
        },
      });

      await Promise.all(
        Array.from(friendIds).map((friendId) =>
          prisma.notification.upsert({
            where: { id: `notif-${friendId}-${photo.id}-upload` },
            update: {
              userId: friendId,
              type: 'UPLOAD',
              metadata,
              readAt: null,
            },
            create: {
              id: `notif-${friendId}-${photo.id}-upload`,
              userId: friendId,
              type: 'UPLOAD',
              metadata,
            },
          }),
        ),
      );
    }
  }

  return NextResponse.json({ photo: serializePhoto(photo) }, { status: 201 });
}
