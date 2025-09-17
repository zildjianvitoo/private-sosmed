import Link from 'next/link';
import type { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,91,255,0.18),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.15),transparent_45%)]" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border/70 bg-card/95 p-8 shadow-aurora">
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/" className="text-base font-semibold text-foreground">
            Serenity Pulse
          </Link>
          <Link href="/" className="hover:text-primary">
            &larr; Back to feed
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
