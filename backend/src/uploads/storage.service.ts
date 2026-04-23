import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync, existsSync, unlinkSync } from 'fs';
import type { StorageEngine } from 'multer';

export type UploadBucket = 'avatars' | 'fields' | 'news';

const UPLOAD_ROOT = process.env.UPLOAD_ROOT ?? join(process.cwd(), 'uploads');

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

for (const bucket of ['avatars', 'fields', 'news'] as UploadBucket[]) {
  ensureDir(join(UPLOAD_ROOT, bucket));
}

export function makeDiskStorage(bucket: UploadBucket): StorageEngine {
  return diskStorage({
    destination: join(UPLOAD_ROOT, bucket),
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase() || '.bin';
      cb(null, `${randomUUID()}${ext}`);
    },
  });
}

export function imageFileFilter(
  _req: unknown,
  file: { mimetype: string },
  cb: (err: Error | null, ok: boolean) => void,
): void {
  if (!/^image\/(jpe?g|png|webp|gif|heic|heif)$/i.test(file.mimetype)) {
    cb(new Error('Only image files are allowed'), false);
    return;
  }
  cb(null, true);
}

@Injectable()
export class StorageService {
  /** Returns the public URL for a stored file (path served by ServeStaticModule). */
  publicUrl(bucket: UploadBucket, filename: string): string {
    const base = process.env.PUBLIC_URL ?? '';
    return `${base}/uploads/${bucket}/${filename}`;
  }

  /** Removes a file from disk. No-op when the path is outside the upload root. */
  remove(bucket: UploadBucket, filename: string): void {
    const full = join(UPLOAD_ROOT, bucket, filename);
    if (!full.startsWith(UPLOAD_ROOT)) return;
    if (existsSync(full)) {
      try {
        unlinkSync(full);
      } catch {
        /* ignore */
      }
    }
  }

  /** Extracts the filename portion from a stored public URL, or null. */
  filenameFromUrl(url: string, bucket: UploadBucket): string | null {
    const prefix = `/uploads/${bucket}/`;
    const idx = url.indexOf(prefix);
    if (idx < 0) return null;
    return url.slice(idx + prefix.length) || null;
  }

  get uploadRoot(): string {
    return UPLOAD_ROOT;
  }
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
