// 서버/클라이언트 공용 스토리지 경로 규칙
export const UPLOAD_KINDS = ['avatars', 'album', 'profile', 'board'] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];
export type ImageExt = 'webp' | 'jpg';

export const isUploadKind = (v: unknown): v is UploadKind =>
  typeof v === 'string' && (UPLOAD_KINDS as readonly string[]).includes(v);

/** 원본 경로에서 썸네일 경로를 만듭니다. album/u/x.webp → album/u/x_thumb.webp */
export const thumbPathOf = (path: string) => path.replace(/\.(webp|jpg)$/, '_thumb.$1');

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** 경로가 해당 사용자가 해당 용도로 업로드한 파일인지 확인 (다른 사람 파일 참조 방지) */
export function isOwnedPath(path: unknown, kind: UploadKind, userId: string): path is string {
  if (typeof path !== 'string') return false;
  return new RegExp(`^${kind}/${userId}/${UUID}\\.(webp|jpg)$`).test(path);
}

export const isUuid = (v: string) => new RegExp(`^${UUID}$`, 'i').test(v);
