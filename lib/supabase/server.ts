import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_BUCKET } from '@/lib/constants';
import { thumbPathOf } from '@/lib/storage-paths';

let adminClient: SupabaseClient | null = null;

/** service_role 키를 사용하는 서버 전용 클라이언트. 절대 클라이언트 컴포넌트에서 import 금지. */
export function supabaseAdmin() {
  if (!adminClient) {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
    adminClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return adminClient;
}

export const bucket = () => supabaseAdmin().storage.from(STORAGE_BUCKET);

const SIGNED_URL_TTL = 60 * 60 * 2; // 2시간

/** 비공개 버킷 이미지를 위한 서명 URL을 한 번에 발급합니다. */
export async function signUrls(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => typeof p === 'string' && p.length > 0))];
  if (unique.length === 0) return {};
  try {
    const { data, error } = await bucket().createSignedUrls(unique, SIGNED_URL_TTL);
    if (error || !data) {
      console.error('[storage] signed url error', error?.message);
      return {};
    }
    const out: Record<string, string> = {};
    for (const item of data) {
      if (item.path && item.signedUrl && !item.error) out[item.path] = item.signedUrl;
    }
    return out;
  } catch (e) {
    console.error('[storage] signed url failure', e);
    return {};
  }
}

/** 원본 + 썸네일 서명 URL */
export async function signImagePaths(paths: string[]) {
  const urls = await signUrls(paths.flatMap((p) => [p, thumbPathOf(p)]));
  return (path: string) => ({
    full: urls[path] ?? null,
    thumb: urls[thumbPathOf(path)] ?? urls[path] ?? null,
  });
}

/** 파일 삭제 (썸네일 포함). 실패해도 예외를 던지지 않습니다. */
export async function removeObjects(paths: (string | null | undefined)[], withThumbs = true) {
  const list = paths.filter((p): p is string => typeof p === 'string' && p.length > 0);
  const all = withThumbs ? list.flatMap((p) => [p, thumbPathOf(p)]) : list;
  if (all.length === 0) return;
  try {
    for (let i = 0; i < all.length; i += 100) {
      const { error } = await bucket().remove(all.slice(i, i + 100));
      if (error) console.error('[storage] remove error', error.message);
    }
  } catch (e) {
    console.error('[storage] remove failure', e);
  }
}
