import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

type PrismaWithPhoto = PrismaClient & {
  photo: PrismaClient['photo'];
};

export function getPhotoClient(): PrismaWithPhoto['photo'] {
  if (!('photo' in prisma)) {
    throw new Error(
      'Photo model not found on Prisma client. Run "npm run db:generate" after pulling the latest schema.',
    );
  }

  return (prisma as PrismaWithPhoto).photo;
}
