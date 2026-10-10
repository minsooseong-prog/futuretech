'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userPreferences, users } from '@/lib/db/schema';
import { burnPasswordCheck, hashPassword, verifyPassword } from '@/lib/auth/password';
import { clearEvents, clientIp, isRateLimited, recordEvent } from '@/lib/auth/rate-limit';
import { createSession, destroyCurrentSession } from '@/lib/auth/session';
import { firstError, loginSchema, registerSchema } from '@/lib/validation/schemas';
import { parseStudentId } from '@/lib/utils/student';
import { dbErrorCode, str } from '@/lib/actions/helpers';
import type { ActionState } from '@/lib/actions/types';

export async function registerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: str(fd, 'name'),
    studentId: str(fd, 'studentId'),
    password: str(fd, 'password'),
    passwordConfirm: str(fd, 'passwordConfirm'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { name, studentId, password } = parsed.data;
  const info = parseStudentId(studentId);
  if (!info) return { error: '학번을 확인해주세요. 학년은 1~3, 반과 번호는 01 이상이어야 합니다.' };

  // 학교 와이파이처럼 IP를 공유하는 경우를 고려해 넉넉하게 제한합니다.
  const ipKey = `register:${await clientIp()}`;
  if (await isRateLimited(ipKey, 60, 60 * 60 * 1000)) {
    return { error: '가입 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' };
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.studentId, studentId)).limit(1);
  if (existing.length > 0) return { error: '이미 가입된 학번입니다.' };

  let userId: string;
  try {
    const passwordHash = await hashPassword(password);
    const [created] = await db
      .insert(users)
      .values({ name, studentId, passwordHash, role: 'student', ...info })
      .returning({ id: users.id });
    userId = created.id;
    await db.insert(userPreferences).values({ userId, theme: 'light' }).onConflictDoNothing();
  } catch (e) {
    if (dbErrorCode(e) === '23505') return { error: '이미 가입된 학번입니다.' };
    console.error('[register]', e);
    return { error: '회원가입 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요.' };
  }

  await recordEvent(ipKey);
  await createSession(userId);
  redirect('/home');
}

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    name: str(fd, 'name'),
    studentId: str(fd, 'studentId'),
    password: str(fd, 'password'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { name, studentId, password } = parsed.data;

  const idKey = `login:id:${studentId}`;
  const ipKey = `login:ip:${await clientIp()}`;
  if ((await isRateLimited(idKey, 5)) || (await isRateLimited(ipKey, 40))) {
    return { error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.' };
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.studentId, studentId))
    .limit(1);

  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : await burnPasswordCheck(password);
  if (!user || !passwordOk || user.name.trim() !== name.trim()) {
    await Promise.all([recordEvent(idKey), recordEvent(ipKey)]);
    return { error: '이름, 학번 또는 비밀번호가 올바르지 않습니다.' };
  }

  await clearEvents(idKey);
  await createSession(user.id);
  redirect('/home');
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect('/login');
}
