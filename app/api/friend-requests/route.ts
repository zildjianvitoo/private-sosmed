import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { normaliseFriendshipPair } from '@/lib/friendship';

const userSummarySelect = {
  id: true,
  displayName: true,
  handle: true,
  image: true,
  bio: true,
};

const createRequestSchema = z.object({
  recipientId: z.string().cuid(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const [incoming, outgoing] = await prisma.$transaction([
    prisma.friendRequest.findMany({
      where: { recipientId: userId, status: 'PENDING' },
      include: { requester: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendRequest.findMany({
      where: { requesterId: userId, status: 'PENDING' },
      include: { recipient: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    incoming: incoming.map((request) => ({
      id: request.id,
      createdAt: request.createdAt,
      requester: request.requester,
    })),
    outgoing: outgoing.map((request) => ({
      id: request.id,
      createdAt: request.createdAt,
      recipient: request.recipient,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const json = await request.json().catch(() => null);
  const parsed = createRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { recipientId } = parsed.data;

  if (recipientId === userId) {
    return NextResponse.json({ error: 'You cannot add yourself.' }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: recipientId },
    select: userSummarySelect,
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const pair = normaliseFriendshipPair(userId, recipientId);
  const existingFriendship = await prisma.friendship.findUnique({
    where: { userAId_userBId: pair },
  });

  if (existingFriendship) {
    return NextResponse.json({ error: 'You are already friends.' }, { status: 409 });
  }

  const existingInverse = await prisma.friendRequest.findUnique({
    where: {
      requesterId_recipientId: {
        requesterId: recipientId,
        recipientId: userId,
      },
    },
  });

  if (existingInverse && existingInverse.status === 'PENDING') {
    const friendship = await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: existingInverse.id },
        data: { status: 'ACCEPTED' },
      });

      return tx.friendship.upsert({
        where: { userAId_userBId: pair },
        update: {},
        create: pair,
      });
    });

    return NextResponse.json(
      {
        status: 'FRIENDSHIP',
        friendship,
      },
      { status: 201 },
    );
  }

  const existingOutgoing = await prisma.friendRequest.findUnique({
    where: {
      requesterId_recipientId: {
        requesterId: userId,
        recipientId,
      },
    },
  });

  if (existingOutgoing && existingOutgoing.status === 'PENDING') {
    return NextResponse.json({ error: 'Request already sent.' }, { status: 409 });
  }

  const requestRecord = await prisma.friendRequest.upsert({
    where: {
      requesterId_recipientId: {
        requesterId: userId,
        recipientId,
      },
    },
    update: {
      status: 'PENDING',
      updatedAt: new Date(),
    },
    create: {
      requesterId: userId,
      recipientId,
    },
    include: {
      recipient: { select: userSummarySelect },
    },
  });

  return NextResponse.json(
    {
      status: 'REQUEST',
      request: {
        id: requestRecord.id,
        createdAt: requestRecord.createdAt,
        recipient: requestRecord.recipient,
      },
    },
    { status: 201 },
  );
}
