import type { NextConfig } from 'next';

const extraDomain = (() => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!envUrl) return null;
  try {
    const url = envUrl.startsWith('http') ? new URL(envUrl) : new URL(`https://${envUrl}`);
    return url.hostname;
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_APP_URL/VERCEL_URL for image domain:', error);
    return null;
  }
})();

const domains = ['localhost', '127.0.0.1'];
if (extraDomain && !domains.includes(extraDomain)) {
  domains.push(extraDomain);
}

const nextConfig: NextConfig = {
  images: {
    domains,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

export default nextConfig;
