import type { PropsWithChildren } from 'react';

import { SiteHeader } from '@/components/layout/site-header';

export default function FeedLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
