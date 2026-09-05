import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { UserFacingError } from '@/lib/utils/errors';

/**
 * Supabase is used for ONE thing in this project: private object storage.
 * The relational data lives in Neon.
 *
 * Bucket layout — a single PRIVATE bucket with logical folders:
 *
 *   avatars/{userId}/{uuid}.webp
 *   album/{albumPostId}/{uuid}.webp
 *   posts/{postId}/{uuid}.webp
 *   profile/{userId}/{uuid}.webp
 *
 * One bucket keeps policy management simple (a single "no public access" rule)
 * and means the app only needs one env var. Because nothing is public, every
 * read goes through a signed URL minted on the server.
 */
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'future-tech';

export type UploadFolder = 'avatars' | 'album' | 'posts' | 'profile';

let cached: SupabaseClient | null = null;

export function storageClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('SUPABASE_URL is not set.');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export async function uploadObject(
  path: string,
  body: ArrayBuffer | Buffer | Blob,
  contentType: string,
): Promise<void> {
  const { error } = await storageClient()
    .storage.from(STORAGE_BUCKET)
    .upload(path, body, { contentType, upsert: false, cacheControl: '3600' });

  if (error) {
    console.error('[storage] upload failed', path, error.message);
    throw new UserFacingError('업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

/** Never throws — deletion is always best-effort cleanup. */
export async function removeObjects(paths: string[]): Promise<void> {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return;
  try {
    await storageClient().storage.from(STORAGE_BUCKET).remove(clean);
  } catch (err) {
    console.error('[storage] cleanup failed', clean, err);
  }
}

export async function signedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await storageClient()
    .storage.from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) {
    console.error('[storage] signing failed', path, error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

export async function signedUrls(
  paths: string[],
  expiresIn = 3600,
): Promise<Record<string, string>> {
  const clean = Array.from(new Set(paths.filter(Boolean)));
  if (clean.length === 0) return {};

  const { data, error } = await storageClient()
    .storage.from(STORAGE_BUCKET)
    .createSignedUrls(clean, expiresIn);

  if (error || !data) {
    console.error('[storage] batch signing failed', error?.message);
    return {};
  }

  const map: Record<string, string> = {};
  for (const item of data) {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  }
  return map;
}
