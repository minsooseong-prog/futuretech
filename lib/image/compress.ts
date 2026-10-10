'use client';

import type { ImageExt } from '@/lib/storage-paths';

export type CompressedImage = { blob: Blob; type: string; ext: ImageExt };

let webpSupport: boolean | null = null;
function supportsWebp() {
  if (webpSupport === null) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    webpSupport = c.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return webpSupport;
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      // EXIF 회전 정보를 반영해 디코딩합니다.
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // 일부 브라우저/포맷은 아래 방식으로 대체
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 열 수 없습니다. JPG, PNG, WebP 파일을 사용해주세요.'));
    };
    img.src = url;
  });
}

/**
 * 긴 변 기준 maxSize로 축소 후 WebP(미지원 시 JPEG)로 다시 인코딩합니다.
 * 캔버스로 다시 그리므로 EXIF(위치 정보 등) 메타데이터는 제거됩니다.
 */
export async function compressImage(file: File, maxSize: number, quality = 0.8): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 업로드할 수 있습니다.');
  const img = await decode(file);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지를 처리할 수 없습니다.');

  const type = supportsWebp() ? 'image/webp' : 'image/jpeg';
  if (type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img.source, 0, 0, width, height);
  img.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 변환할 수 없습니다.'))), type, quality),
  );
  return { blob, type, ext: type === 'image/webp' ? 'webp' : 'jpg' };
}
