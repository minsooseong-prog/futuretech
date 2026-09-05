'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userPreferences, users } from '@/lib/db/schema';
import { requireAdminOrThrow, requireUserOrThrow } from '@/lib/auth/guard';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { destroyAllSessionsFor, createSession } from '@/lib/auth/session';
import { updateSitePassword } from '@/lib/settings';
import { changePasswordSchema, roleChangeSchema, sitePasswordSchema, themeSchema } from '@/lib/validation/schemas';
import { fail, succeed, toActionError, zodToFieldErrors, type ActionResult } from '@/lib/utils/errors';

const THEME_COOKIE = 'ft_theme';

export async function setTheme(theme: 'light' | 'dark'): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const parsed = themeSchema.safeParse({ theme });
    if (!parsed.success) return fail('테마 값이 올바르지 않습니다.');

    await db
      .insert(userPreferences)
      .values({ userId: user.id, theme: parsed.data.theme })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { theme: parsed.data.theme, updatedAt: new Date() },
      });

    // Mirrored into a cookie so the server can render the right class on the
    // very first paint instead of flashing the wrong theme.
    const jar = await cookies();
    jar.set(THEME_COOKIE, parsed.data.theme, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return succeed(undefined, parsed.data.theme === 'dark' ? '다크 테마로 바꿨습니다.' : '라이트 테마로 바꿨습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function changeOwnPassword(_prev: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      newPasswordConfirm: formData.get('newPasswordConfirm'),
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    const rows = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const account = rows[0];
    if (!account || !(await verifyPassword(parsed.data.currentPassword, account.passwordHash))) {
      return fail('현재 비밀번호가 올바르지 않습니다.', {
        currentPassword: '비밀번호가 올바르지 않습니다.',
      });
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(parsed.data.newPassword), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Sign every other device out, then re-issue a session for this one.
    await destroyAllSessionsFor(user.id);
    await createSession(user.id);

    return succeed(undefined, '비밀번호를 바꿨습니다. 다른 기기는 로그아웃됩니다.');
  } catch (err) {
    return toActionError(err);
  }
}

/** Admin only: rotate the shared notice or calendar password. */
export async function changeSitePassword(_prev: unknown, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminOrThrow();

    const parsed = sitePasswordSchema.safeParse({
      target: formData.get('target'),
      newPassword: formData.get('newPassword'),
      newPasswordConfirm: formData.get('newPasswordConfirm'),
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    // Only the hash is written; the existing value is never read back out.
    await updateSitePassword(parsed.data.target, parsed.data.newPassword);

    revalidatePath('/settings');
    return succeed(
      undefined,
      parsed.data.target === 'notice' ? '공지 비밀번호를 바꿨습니다.' : '일정 비밀번호를 바꿨습니다.',
    );
  } catch (err) {
    return toActionError(err);
  }
}

export async function changeUserRole(_prev: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdminOrThrow();

    const parsed = roleChangeSchema.safeParse({
      userId: formData.get('userId'),
      role: formData.get('role'),
    });

    if (!parsed.success) return fail('역할 정보를 확인해 주세요.');
    if (parsed.data.userId === admin.id) return fail('자신의 역할은 바꿀 수 없습니다.');

    const rows = await db
      .select({ id: users.id, studentId: users.studentId })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);

    const target = rows[0];
    if (!target) return fail('사용자를 찾을 수 없습니다.');

    await db
      .update(users)
      .set({ role: parsed.data.role, updatedAt: new Date() })
      .where(eq(users.id, parsed.data.userId));

    revalidatePath('/settings');
    revalidatePath('/members');
    return succeed(undefined, '역할을 바꿨습니다.');
  } catch (err) {
    return toActionError(err);
  }
}
