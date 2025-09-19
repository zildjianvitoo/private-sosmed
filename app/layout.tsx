import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

import { AppProviders } from '@/components/providers/app-providers';
import { auth } from '@/auth';

const geistSans = localFont({
  src: './fonts/GeistVariableVF.woff2',
  variable: '--font-geist-sans',
  style: 'normal',
  weight: '100 900',
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVariableVF.woff2',
  variable: '--font-geist-mono',
  style: 'normal',
  weight: '100 900',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Serenity Pulse',
    template: '%s · Serenity Pulse',
  },
  description:
    'A private social space for sharing visual stories, connecting with friends, and curating inspiration.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
