'use client';

/**
 * Phone cameras produce 4–12 MB JPEGs. Sending those straight to Supabase would
 * burn through a free storage tier in a term, so every image is resized and
 * re-encoded as WebP in the browser before it ever reaches the network.
 *
 * Drawing to a canvas also drops EXIF (including GPS), which matters when the
 * photos are of students.
 */

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export type ProcessedImage = {
  blob: Blob;
  width: number;
  height: number;
  previewUrl: string;
};

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* Safari/HEIC fall back to <img> below. */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('이미지를 변환하지 못했습니다.'))),
      'image/webp',
      quality,
    );
  });
}

export async function processImage(
  file: File,
  { maxSize = 1600, quality = 0.82 }: { maxSize?: number; quality?: number } = {},
): Promise<ProcessedImage> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('12MB 이하의 이미지만 올릴 수 있습니다.');
  }

  const source = await loadBitmap(file);
  const sw = 'width' in source ? source.width : 0;
  const sh = 'height' in source ? source.height : 0;
  if (!sw || !sh) throw new Error('이미지 크기를 확인할 수 없습니다.');

  const scale = Math.min(1, maxSize / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지를 변환하지 못했습니다.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);

  if ('close' in source && typeof source.close === 'function') source.close();

  const blob = await encode(canvas, quality);
  return { blob, width, height, previewUrl: URL.createObjectURL(blob) };
}

export type UploadedImage = { path: string; thumbPath: string | null; previewUrl: string };

/** Uploads through our own authenticated route — the service key stays on the server. */
async function send(blob: Blob, folder: string, filename: string): Promise<string> {
  const body = new FormData();
  body.append('file', blob, filename);
  body.append('folder', folder);

  const res = await fetch('/api/upload', { method: 'POST', body });
  const json = (await res.json().catch(() => null)) as { path?: string; error?: string } | null;

  if (!res.ok || !json?.path) {
    throw new Error(json?.error || '업로드에 실패했습니다.');
  }
  return json.path;
}

/**
 * Uploads a display-sized image and, when asked, a small thumbnail so that grids
 * and lists never pull the full-resolution file.
 */
export async function uploadImage(
  file: File,
  folder: 'avatars' | 'album' | 'posts' | 'profile',
  options: { withThumb?: boolean; maxSize?: number; quality?: number } = {},
): Promise<UploadedImage> {
  const { withThumb = false, maxSize = 1600, quality = 0.82 } = options;

  const main = await processImage(file, { maxSize, quality });
  const path = await send(main.blob, folder, 'image.webp');

  let thumbPath: string | null = null;
  if (withThumb) {
    try {
      const thumb = await processImage(file, { maxSize: 480, quality: 0.75 });
      thumbPath = await send(thumb.blob, folder, 'thumb.webp');
      URL.revokeObjectURL(thumb.previewUrl);
    } catch (err) {
      // A missing thumbnail is cosmetic; the full image still works.
      console.warn('[upload] thumbnail skipped', err);
    }
  }

  return { path, thumbPath, previewUrl: main.previewUrl };
}

export { mediaUrl, thumbUrl } from '@/lib/media';
