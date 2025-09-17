import NextAuth from 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      handle?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    displayName: string;
    handle?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    handle?: string;
  }
}
