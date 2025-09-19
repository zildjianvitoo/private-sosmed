import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { serializeNotifications } from '@/lib/serializers/notification';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 10, 1), 50);

  const [notifications, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return NextResponse.json({
    notifications: serializeNotifications(notifications),
    unreadCount,
  });
}

const markSchema = z
  .object({
    ids: z.array(z.string().min(1)).optional(),
    markAll: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.markAll && (!value.ids || value.ids.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide notification ids or markAll.',
      });
    }
  });

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const parsed = markSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { ids, markAll } = parsed.data;

  const where = markAll
    ? { userId, readAt: null }
    : {
        userId,
        readAt: null,
        id: { in: ids ?? [] },
      };

  const result = await prisma.notification.updateMany({
    where,
    data: { readAt: new Date() },
  });

  return NextResponse.json({ updated: result.count });
}
