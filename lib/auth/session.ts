import 'server-only';
import { createHmac, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions, userPreferences, users, type Role, type Theme } from '@/lib/db/schema';

export const SESSION_COOKIE = 'ft_session';
const SESSION_DAYS = 30;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET 환경변수는 32자 이상이어야 합니다.');
  }
  return secret;
}

// 쿠키에는 무작위 토큰만, DB에는 HMAC 해시만 저장합니다.
// DB가 유출되어도 해시로 세션을 탈취할 수 없습니다.
function hashToken(token: string) {
  return createHmac('sha256', sessionSecret()).update(token).digest('hex');
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export type SessionUser = {
  id: string;
  studentId: string;
  name: string;
  role: Role;
  grade: number | null;
  classNumber: number | null;
  studentNumber: number | null;
  avatarPath: string | null;
  bio: string | null;
  createdAt: Date;
  theme: Theme;
};

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 128) return null;

  const rows = await db
    .select({
      id: users.id,
      studentId: users.studentId,
      name: users.name,
      role: users.role,
      grade: users.grade,
      classNumber: users.classNumber,
      studentNumber: users.studentNumber,
      avatarPath: users.avatarPath,
      bio: users.bio,
      createdAt: users.createdAt,
      theme: userPreferences.theme,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(userPreferences, eq(userPreferences.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return { ...row, theme: row.theme ?? 'light' };
});

/** 페이지용: 로그인하지 않았으면 로그인 페이지로 이동 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/** 페이지용: 관리자가 아니면 홈으로 이동 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/home');
  return user;
}

export async function destroyCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && token.length <= 128) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
