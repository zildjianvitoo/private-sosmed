import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/login-form';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <LoginForm />
      <div className="space-y-3 text-sm text-center text-muted-foreground">
        <Separator className="mx-auto w-24" />
        <p>
          New to Serenity Pulse?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
