import type { Metadata } from 'next';
import Link from 'next/link';

import { RegisterForm } from '@/components/auth/register-form';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Create account',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <RegisterForm />
      <div className="space-y-3 text-sm text-center text-muted-foreground">
        <Separator className="mx-auto w-24" />
        <p>
          Already part of the community?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
