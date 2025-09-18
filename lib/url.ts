export function getAppBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (envUrl) {
    return envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
  }

  // Default to local dev URL
  return 'http://localhost:3000';
}
