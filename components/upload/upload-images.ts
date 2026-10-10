'use client';

import { compressImage } from '@/lib/image/compress';
import { supabaseBrowser } from '@/lib/supabase/client';
import { discardUploads, requestUploadUrls } from '@/lib/actions/upload';
import { STORAGE_BUCKET, IMAGE_SIZES } from '@/lib/constants';
import type { UploadKind } from '@/lib/storage-paths';

type Options = { maxSize?: number; thumb?: boolean; quality?: number };

/**
 * 1) 브라우저에서 리사이즈·WebP 변환  2) 서버에서 서명 업로드 URL 발급
 * 3) Supabase로 직접 업로드  4) 저장 경로 반환 (DB 기록은 호출한 쪽의 서버 액션이 담당)
 * 하나라도 실패하면 이미 올라간 파일을 정리하고 예외를 던집니다.
 */
export async function uploadImages(files: File[], kind: UploadKind, opts: Options = {}): Promise<string[]> {
  if (files.length === 0) return [];
  const { maxSize = IMAGE_SIZES.full, thumb = true, quality = 0.8 } = opts;

  const processed = await Promise.all(
    files.map(async (file) => ({
      main: await compressImage(file, maxSize, quality),
      thumb: thumb ? await compressImage(file, IMAGE_SIZES.thumb, 0.75) : null,
    })),
  );

  const res = await requestUploadUrls(
    kind,
    processed.map((p) => p.main.ext),
    thumb,
  );
  if ('error' in res) throw new Error(res.error);

  const storage = supabaseBrowser().storage.from(STORAGE_BUCKET);
  const uploaded: string[] = [];
  try {
    await Promise.all(
      res.targets.map(async (target, i) => {
        const item = processed[i];
        const main = await storage.uploadToSignedUrl(target.path, target.token, item.main.blob, {
          contentType: item.main.type,
        });
        if (main.error) throw main.error;
        uploaded.push(target.path);
        if (target.thumb && item.thumb) {
          const t = await storage.uploadToSignedUrl(target.thumb.path, target.thumb.token, item.thumb.blob, {
            contentType: item.thumb.type,
          });
          if (t.error) throw t.error;
        }
      }),
    );
  } catch (e) {
    console.error('[upload]', e);
    if (uploaded.length > 0) await discardUploads(kind, uploaded).catch(() => undefined);
    throw new Error('사진 업로드에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.');
  }

  return res.targets.map((t) => t.path);
}

export async function discardAfterFailure(kind: UploadKind, paths: string[]) {
  if (paths.length > 0) await discardUploads(kind, paths).catch(() => undefined);
}
