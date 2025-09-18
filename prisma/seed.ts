import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { access, mkdir, writeFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const uploadsDir = path.join(process.cwd(), 'public/uploads');

async function ensureUploadsDir() {
  await mkdir(uploadsDir, { recursive: true });
}

async function saveImageFromUrl(url: string, fileName: string) {
  await ensureUploadsDir();
  const target = path.join(uploadsDir, fileName);

  try {
    await access(target);
    return `uploads/${fileName}`;
  } catch {
    // File doesn't exist yet, download it.
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(target, buffer);
  return `uploads/${fileName}`;
}

async function upsertUser({
  email,
  handle,
  displayName,
  name,
  bio,
  password,
}: {
  email: string;
  handle: string;
  displayName: string;
  name?: string;
  bio?: string;
  password: string;
}) {
  const passwordHash = await hash(password, 12);

  return prisma.user.upsert({
    where: { email },
    update: {
      displayName,
      handle,
      name: name ?? displayName,
      bio,
    },
    create: {
      email,
      passwordHash,
      displayName,
      handle,
      name: name ?? displayName,
      bio,
    },
  });
}

async function main() {
  const demo = await upsertUser({
    email: 'demo@sosmed.local',
    handle: 'demouser',
    displayName: 'Demo User',
    bio: 'Photography explorer & storyteller.',
    password: 'password123',
  });

  const kai = await upsertUser({
    email: 'kai@sosmed.local',
    handle: 'kaisei',
    displayName: 'Kai Seiwa',
    bio: 'Architecting skylines, shooting sunsets.',
    password: 'password123',
  });

  const mira = await upsertUser({
    email: 'mira@sosmed.local',
    handle: 'miralux',
    displayName: 'Mira Lux',
    bio: 'Portrait artist & color grading nerd.',
    password: 'password123',
  });

  const arya = await upsertUser({
    email: 'arya@sosmed.local',
    handle: 'aryatrails',
    displayName: 'Arya Trails',
    bio: 'Capturing adventures in 35mm.',
    password: 'password123',
  });

  // Seed an existing friendship between demo and Kai if missing
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: demo.id, userBId: kai.id },
        { userAId: kai.id, userBId: demo.id },
      ],
    },
  });

  if (!existingFriendship) {
    await prisma.friendship.create({
      data: {
        userAId: demo.id < kai.id ? demo.id : kai.id,
        userBId: demo.id < kai.id ? kai.id : demo.id,
      },
    });
  }

  // Create a pending request from Mira to Demo if not present
  await prisma.friendRequest.upsert({
    where: {
      requesterId_recipientId: {
        requesterId: mira.id,
        recipientId: demo.id,
      },
    },
    update: {
      status: 'PENDING',
    },
    create: {
      requesterId: mira.id,
      recipientId: demo.id,
    },
  });

  // Create outgoing request from Demo to Arya
  await prisma.friendRequest.upsert({
    where: {
      requesterId_recipientId: {
        requesterId: demo.id,
        recipientId: arya.id,
      },
    },
    update: {
      status: 'PENDING',
    },
    create: {
      requesterId: demo.id,
      recipientId: arya.id,
    },
  });

  const samplePhotos = [
    {
      id: 'photo-demo-sunrise',
      ownerId: demo.id,
      caption: 'Golden hour at the boardwalk.',
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
      fileName: 'demo-sunrise.jpg',
    },
    {
      id: 'photo-kai-architecture',
      ownerId: kai.id,
      caption: 'Neon reflections downtown.',
      url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
      fileName: 'kai-neon.jpg',
    },
    {
      id: 'photo-mira-portrait',
      ownerId: mira.id,
      caption: 'Cinematic portrait study.',
      url: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=1600&q=80',
      fileName: 'mira-portrait.jpg',
    },
  ];

  for (const sample of samplePhotos) {
    const filePath = await saveImageFromUrl(sample.url, sample.fileName);
    await prisma.photo.upsert({
      where: { id: sample.id },
      update: {
        ownerId: sample.ownerId,
        caption: sample.caption,
        filePath,
      },
      create: {
        id: sample.id,
        ownerId: sample.ownerId,
        caption: sample.caption,
        filePath,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
