import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { and, eq, gt, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';

export const SESSION_COOKIE = 'ft_session';
const SESSION_DAYS = 14;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET is missing or too short (needs 16+ characters).');
  }
  return s;
}

/** Cookie holds the raw token; the database only ever stores its digest. */
function digest(token: string): string {
  return createHash('sha256').update(`${token}.${secret()}`).digest('hex');
}

export type SessionUser = {
  id: string;
  studentId: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  grade: number | null;
  classNumber: number | null;
  studentNumber: number | null;
  avatarPath: string | null;
  bio: string | null;
  createdAt: Date;
};

export async function createSession(userId: string, userAgent?: string | null): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash: digest(token),
    userAgent: userAgent?.slice(0, 200) ?? null,
    expiresAt,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  // Opportunistic cleanup of expired rows; cheap and keeps the table small.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/** Reads the current session. Wrapped in cache() so one render hits the DB once. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

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
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, digest(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
});

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, digest(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** Used after password changes and account deletion. */
export async function destroyAllSessionsFor(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
