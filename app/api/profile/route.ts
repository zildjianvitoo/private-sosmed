import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { z } from 'zod';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ensureUploadsDir, generateUploadFileName, getPublicPath } from '@/lib/uploads';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const profileSchema = z.object({
  displayName: z.string().min(2).max(60),
  handle: z
    .string()
    .optional()
    .transform((value) => value?.trim() || null)
    .refine((val) => (val ? /^[a-z0-9_\.\-]{3,30}$/i.test(val) : true), {
      message:
        'Handle must be 3-30 characters and contain only letters, numbers, underscores, dots, or dashes.',
    }),
  bio: z
    .string()
    .optional()
    .transform((value) => value?.trim() || null)
    .refine((val) => (val ? val.length <= 160 : true), {
      message: 'Bio must be 160 characters or less.',
    }),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = profileSchema.safeParse({
    displayName: formData.get('displayName'),
    handle: formData.get('handle'),
    bio: formData.get('bio'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid profile data',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { displayName, handle, bio } = parsed.data;
  const avatar = formData.get('avatar');

  if (handle) {
    const existingHandle = await prisma.user.findFirst({
      where: {
        handle: handle.toLowerCase(),
        id: { not: session.user.id },
      },
      select: { id: true },
    });

    if (existingHandle) {
      return NextResponse.json({ error: 'Handle is already taken.' }, { status: 409 });
    }
  }

  let avatarPath: string | undefined;
  if (avatar instanceof File) {
    if (!ALLOWED_MIME.has(avatar.type)) {
      return NextResponse.json({ error: 'Unsupported avatar type.' }, { status: 415 });
    }

    if (avatar.size > MAX_AVATAR_SIZE) {
      return NextResponse.json({ error: 'Avatar exceeds 5MB limit.' }, { status: 413 });
    }

    const uploadDir = await ensureUploadsDir();
    const fileName = generateUploadFileName(avatar.name, avatar.type);
    const arrayBuffer = await avatar.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const diskPath = path.join(uploadDir, fileName);
    await writeFile(diskPath, buffer);
    avatarPath = getPublicPath(fileName);
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName,
      handle: handle?.toLowerCase() ?? null,
      bio,
      ...(avatarPath ? { image: avatarPath } : {}),
    },
    select: {
      id: true,
      displayName: true,
      handle: true,
      bio: true,
      image: true,
    },
  });

  return NextResponse.json({ user: updatedUser });
}
