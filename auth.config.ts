import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { z } from 'zod';

import prisma from '@/lib/prisma';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.name ?? undefined,
          image: user.image ?? undefined,
          handle: user.handle ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        if (session.name) {
          token.name = session.name;
        }
        if ((session as unknown as { picture?: string }).picture !== undefined) {
          token.picture = (session as unknown as { picture?: string }).picture ?? null;
        }
        if ((session as unknown as { handle?: string }).handle !== undefined) {
          token.handle = (session as unknown as { handle?: string }).handle ?? null;
        }
      }
      if (user) {
        token.id = user.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        if (user.image) {
          token.picture = user.image.startsWith('/') ? user.image : `/${user.image}`;
        }
        if ('handle' in user && user.handle) {
          token.handle = user.handle.toLowerCase();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
        if (token.name) {
          session.user.name = token.name as string;
        }
        if ('picture' in token) {
          const picture = (token.picture as string | null) ?? null;
          (session.user as typeof session.user & { image?: string | null }).image =
            picture && !picture.startsWith('/') ? `/${picture}` : picture;
        }
        if ('handle' in token) {
          (session.user as typeof session.user & { handle?: string | null }).handle =
            (token.handle as string | null) ?? null;
        }
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

export default authConfig;
