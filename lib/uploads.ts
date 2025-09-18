import { mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const uploadDir = path.join(process.cwd(), 'public/uploads');

export async function ensureUploadsDir() {
  await mkdir(uploadDir, { recursive: true });
  return uploadDir;
}

export function generateUploadFileName(originalName: string, mimeType: string) {
  const extFromName = path.extname(originalName || '').toLowerCase();
  const mimeExtension =
    mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';

  const extension = extFromName || mimeExtension;
  const hash = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${extension}`;
}

export function getPublicPath(fileName: string) {
  return path.posix.join('uploads', fileName);
}
