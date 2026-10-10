import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getCurrentUser } from '@/lib/auth/session';
import { uploadObject, type UploadFolder } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FOLDERS: UploadFolder[] = ['avatars', 'album', 'posts', 'profile'];
const MAX_BYTES = 6 * 1024 * 1024; // images arrive already compressed to WebP
const ALLOWED = new Set(['image/webp', 'image/jpeg', 'image/png']);

const EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/**
 * The only path by which bytes reach Supabase. It requires a session, caps the
 * size, pins the content type, and builds the object key itself — a client can
 * never choose where its file lands.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const file = form.get('file');
  const folder = String(form.get('folder') ?? '') as UploadFolder;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  }
  if (!FOLDERS.includes(folder)) {
    return NextResponse.json({ error: '잘못된 업로드 경로입니다.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: '빈 파일입니다.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '이미지가 너무 큽니다.' }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: '이미지 파일만 올릴 수 있습니다.' }, { status: 415 });
  }

  // Every object is namespaced under the uploader's id. The client never
  // chooses the key, and ownership of any path can be checked later by prefix.
  const path = `${folder}/${user.id}/${randomUUID()}.${EXT[file.type]}`;

  try {
    await uploadObject(path, await file.arrayBuffer(), file.type);
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 502 });
  }

  return NextResponse.json({ path });
}
