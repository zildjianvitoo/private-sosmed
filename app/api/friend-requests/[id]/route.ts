import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { normaliseFriendshipPair } from '@/lib/friendship';
import { encodeNotificationMetadata } from '@/lib/notifications';

const actionSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

const userSummarySelect = {
  id: true,
  displayName: true,
  handle: true,
  image: true,
  bio: true,
};

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await _request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 422 });
  }

  const userId = session.user.id;
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: userSummarySelect,
  });

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const requestRecord = await prisma.friendRequest.findUnique({
    where: { id: params.id },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (requestRecord.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request already handled' }, { status: 400 });
  }

  if (requestRecord.recipientId !== userId) {
    return NextResponse.json({ error: 'Only the recipient can respond.' }, { status: 403 });
  }

  if (parsed.data.action === 'decline') {
    const updated = await prisma.friendRequest.update({
      where: { id: params.id },
      data: { status: 'DECLINED' },
      include: {
        requester: { select: userSummarySelect },
      },
    });

    await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        type: 'FRIEND_REQUEST',
        metadata: {
          contains: updated.id,
        },
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({
      status: 'DECLINED',
      request: {
        id: updated.id,
        requester: updated.requester,
      },
    });
  }

  const pair = normaliseFriendshipPair(requestRecord.recipientId, requestRecord.requesterId);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.friendRequest.update({
      where: { id: params.id },
      data: { status: 'ACCEPTED' },
      include: {
        requester: { select: userSummarySelect },
      },
    });

    const friendship = await tx.friendship.upsert({
      where: { userAId_userBId: pair },
      update: {},
      create: pair,
      include: {
        userA: { select: userSummarySelect },
        userB: { select: userSummarySelect },
      },
    });

    await tx.notification.updateMany({
      where: {
        userId,
        readAt: null,
        type: 'FRIEND_REQUEST',
        metadata: {
          contains: updated.id,
        },
      },
      data: { readAt: new Date() },
    });

    await tx.notification.upsert({
      where: { id: `notif-${updated.id}-accepted` },
      update: {
        userId: updated.requesterId,
        type: 'FRIEND_REQUEST',
        metadata: encodeNotificationMetadata({
          variant: 'request_accepted',
          requestId: updated.id,
          by: {
            id: currentUser.id,
            displayName: currentUser.displayName,
            handle: currentUser.handle,
            image: currentUser.image,
          },
        }),
        readAt: null,
      },
      create: {
        id: `notif-${updated.id}-accepted`,
        userId: updated.requesterId,
        type: 'FRIEND_REQUEST',
        metadata: encodeNotificationMetadata({
          variant: 'request_accepted',
          requestId: updated.id,
          by: {
            id: currentUser.id,
            displayName: currentUser.displayName,
            handle: currentUser.handle,
            image: currentUser.image,
          },
        }),
      },
    });

    return { updated, friendship };
  });

  return NextResponse.json({
    status: 'ACCEPTED',
    request: {
      id: result.updated.id,
      requester: result.updated.requester,
    },
    friendship: {
      id: result.friendship.id,
      createdAt: result.friendship.createdAt,
      userA: result.friendship.userA,
      userB: result.friendship.userB,
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const requestRecord = await prisma.friendRequest.findUnique({
    where: { id: params.id },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (requestRecord.requesterId !== userId) {
    return NextResponse.json({ error: 'Only the requester can cancel.' }, { status: 403 });
  }

  if (requestRecord.status !== 'PENDING') {
    await prisma.friendRequest.delete({ where: { id: params.id } });
    return NextResponse.json({ status: 'REMOVED' });
  }

  await prisma.friendRequest.update({
    where: { id: params.id },
    data: { status: 'CANCELED' },
  });

  return NextResponse.json({ status: 'CANCELED' });
}
