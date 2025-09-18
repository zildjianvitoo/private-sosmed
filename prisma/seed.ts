import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

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
