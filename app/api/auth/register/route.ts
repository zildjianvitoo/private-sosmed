import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';

import prisma from '@/lib/prisma';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  displayName: z.string().min(2).max(60),
});

function slugify(input: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 20);
  return slug || 'member';
}

async function generateHandle(base: string) {
  const slug = slugify(base);
  const existing = await prisma.user.findUnique({ where: { handle: slug } });
  if (!existing) {
    return slug;
  }

  for (let i = 1; i < 100; i += 1) {
    const handle = `${slug}${i}`;
    const exists = await prisma.user.findUnique({ where: { handle } });
    if (!exists) {
      return handle;
    }
  }

  return `${slug}${Date.now()}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid registration details', details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { email, password, displayName } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  const handle = await generateHandle(displayName);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      name: displayName,
      handle,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      handle: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
