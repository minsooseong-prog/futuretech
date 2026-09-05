'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, userPreferences } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, destroyCurrentSession } from '@/lib/auth/session';
import { checkThrottle, clearFailures, recordFailure } from '@/lib/auth/rate-limit';
import { loginSchema, registerSchema } from '@/lib/validation/schemas';
import { parseStudentId } from '@/lib/utils/student-id';
import { fail, toActionError, zodToFieldErrors, type ActionResult } from '@/lib/utils/errors';

async function userAgent(): Promise<string | null> {
  const h = await headers();
  return h.get('user-agent');
}

/** Login and registration share one throttle bucket per student ID. */
function throttleKey(studentId: string): string {
  return `login:${studentId}`;
}

export async function registerAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const parsed = registerSchema.safeParse({
      name: formData.get('name'),
      studentId: formData.get('studentId'),
      password: formData.get('password'),
      passwordConfirm: formData.get('passwordConfirm'),
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    const { name, studentId, password } = parsed.data;

    const parsedId = parseStudentId(studentId);
    if (!parsedId) {
      return fail('사용할 수 없는 학번입니다. 예) 20208', { studentId: '학번을 확인해 주세요.' });
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.studentId, studentId))
      .limit(1);

    if (existing.length > 0) {
      return fail('이미 등록된 학번입니다.', { studentId: '이미 등록된 학번입니다.' });
    }

    const [created] = await db
      .insert(users)
      .values({
        studentId,
        name,
        passwordHash: await hashPassword(password),
        role: 'student',
        grade: parsedId.grade,
        classNumber: parsedId.classNumber,
        studentNumber: parsedId.studentNumber,
      })
      .returning({ id: users.id });

    await db.insert(userPreferences).values({ userId: created.id }).onConflictDoNothing();
    await createSession(created.id, await userAgent());
  } catch (err) {
    // A unique-violation here means two people registered the same ID at once.
    if (err instanceof Error && /duplicate key|unique/i.test(err.message)) {
      return fail('이미 등록된 학번입니다.', { studentId: '이미 등록된 학번입니다.' });
    }
    return toActionError(err);
  }

  redirect('/home');
}

export async function loginAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const parsed = loginSchema.safeParse({
      name: formData.get('name'),
      studentId: formData.get('studentId'),
      password: formData.get('password'),
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    const { name, studentId, password } = parsed.data;
    const key = throttleKey(studentId);

    const throttle = await checkThrottle(key);
    if (throttle.locked) {
      const minutes = Math.ceil(throttle.retryAfterSeconds / 60);
      return fail(`로그인 시도가 너무 많습니다. ${minutes}분 후에 다시 시도해 주세요.`);
    }

    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.studentId, studentId), eq(users.name, name)))
      .limit(1);

    const account = rows[0];

    // One message for every failure mode: no hint about which field was wrong.
    if (!account || !(await verifyPassword(password, account.passwordHash))) {
      await recordFailure(key);
      return fail('이름, 학번, 비밀번호를 다시 확인해 주세요.');
    }

    await clearFailures(key);
    await db.insert(userPreferences).values({ userId: account.id }).onConflictDoNothing();
    await createSession(account.id, await userAgent());
  } catch (err) {
    return toActionError(err);
  }

  redirect('/home');
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect('/login');
}

/** Used by the register form to warn about a taken ID before submitting. */
export async function checkStudentIdAvailable(studentId: string): Promise<boolean> {
  if (!/^\d{5}$/.test(studentId)) return false;
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.studentId, studentId))
    .limit(1);
  return rows.length === 0;
}
