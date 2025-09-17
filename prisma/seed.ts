import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const demoPassword = await hash('password123', 12);

  await prisma.user.upsert({
    where: { email: 'demo@sosmed.local' },
    update: {
      displayName: 'Demo User',
      handle: 'demouser',
    },
    create: {
      email: 'demo@sosmed.local',
      passwordHash: demoPassword,
      displayName: 'Demo User',
      handle: 'demouser',
      name: 'Demo User',
      bio: 'Photography explorer & storyteller.',
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
