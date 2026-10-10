import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { signedUrl } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_PREFIX = /^(avatars|album|posts|profile)\//;

/**
 * The bucket is private, so nothing is served directly. This route checks the
 * session, then hands back a short-lived signed URL as a redirect.
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const path = new URL(request.url).searchParams.get('path') ?? '';

  // Reject traversal and anything outside the four known folders.
  if (!path || path.includes('..') || !ALLOWED_PREFIX.test(path)) {
    return NextResponse.json({ error: '잘못된 경로입니다.' }, { status: 400 });
  }

  const url = await signedUrl(path, 60 * 60);
  if (!url) {
    return NextResponse.json({ error: '이미지를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.redirect(url, {
    status: 307,
    // Browser may cache the redirect for a while, but not past the signature.
    headers: { 'Cache-Control': 'private, max-age=1800' },
  });
}
