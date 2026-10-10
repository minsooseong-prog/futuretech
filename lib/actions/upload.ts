'use server';

import { randomUUID } from 'node:crypto';
import { getCurrentUser } from '@/lib/auth/session';
import { isRateLimited, recordEvent } from '@/lib/auth/rate-limit';
import { bucket, removeObjects } from '@/lib/supabase/server';
import { isOwnedPath, isUploadKind, thumbPathOf, type ImageExt, type UploadKind } from '@/lib/storage-paths';
import { LIMITS } from '@/lib/constants';
import type { UploadTarget, UploadUrlsResult } from '@/lib/actions/types';

const MAX_PER_REQUEST: Record<UploadKind, number> = {
  avatars: 1,
  album: LIMITS.albumImages,
  profile: LIMITS.profileImagesPerUpload,
  board: LIMITS.boardImages,
};

/**
 * 로그인한 사용자에게 1회용 서명 업로드 URL을 발급합니다.
 * 경로는 서버가 정하며 {용도}/{userId}/{uuid}.{ext} 형식이라 다른 사람 폴더에 쓸 수 없습니다.
 * 파일은 브라우저에서 Supabase로 직접 올라가므로 Vercel 요청 크기 제한(4.5MB)을 피합니다.
 */
export async function requestUploadUrls(kind: UploadKind, exts: ImageExt[], withThumb: boolean): Promise<UploadUrlsResult> {
  const user = await getCurrentUser();
  if (!user) return { error: '로그인이 필요합니다.' };
  if (!isUploadKind(kind)) return { error: '잘못된 업로드 요청입니다.' };
  if (
    !Array.isArray(exts) ||
    exts.length === 0 ||
    exts.length > MAX_PER_REQUEST[kind] ||
    exts.some((e) => e !== 'webp' && e !== 'jpg')
  ) {
    return { error: '업로드할 수 없는 파일 구성입니다.' };
  }

  const key = `upload:${user.id}`;
  if (await isRateLimited(key, 40, 10 * 60 * 1000)) {
    return { error: '업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' };
  }
  await recordEvent(key);

  try {
    const storage = bucket();
    const targets: UploadTarget[] = await Promise.all(
      exts.map(async (ext) => {
        const path = `${kind}/${user.id}/${randomUUID()}.${ext}`;
        const main = await storage.createSignedUploadUrl(path);
        if (main.error || !main.data) throw main.error ?? new Error('signed upload failed');
        let thumb: UploadTarget['thumb'] = null;
        if (withThumb) {
          const tp = thumbPathOf(path);
          const t = await storage.createSignedUploadUrl(tp);
          if (t.error || !t.data) throw t.error ?? new Error('signed upload failed');
          thumb = { path: tp, token: t.data.token };
        }
        return { path, token: main.data.token, thumb };
      }),
    );
    return { targets };
  } catch (e) {
    console.error('[upload] signed url', e);
    return { error: '업로드를 준비하지 못했습니다. 스토리지 설정을 확인해주세요.' };
  }
}

/** 업로드 후 게시물 저장에 실패했을 때 브라우저가 호출하는 정리용 액션 (본인 파일만 삭제 가능) */
export async function discardUploads(kind: UploadKind, paths: string[]) {
  const user = await getCurrentUser();
  if (!user || !isUploadKind(kind) || !Array.isArray(paths)) return;
  const owned = paths.slice(0, 20).filter((p) => isOwnedPath(p, kind, user.id));
  await removeObjects(owned);
}
