import type { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 shadow-xl shadow-primary/10">
        {children}
      </div>
    </div>
  );
}
