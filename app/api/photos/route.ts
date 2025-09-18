import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

import { auth } from '@/auth';
import prisma, { getPhotoClient } from '@/lib/prisma';
import { ensureUploadsDir, generateUploadFileName, getPublicPath } from '@/lib/uploads';
import { serializePhoto, photoUserSelect } from '@/lib/serializers/photo';

export const runtime = 'nodejs';

const userSummarySelect = {
  id: true,
  displayName: true,
  handle: true,
  image: true,
  bio: true,
};

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

  return NextResponse.json({ photo: serializePhoto(photo) }, { status: 201 });
}
