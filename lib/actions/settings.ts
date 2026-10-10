'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { alumni, profileImages, sessions, siteSettings, userPreferences, users, type Role } from '@/lib/db/schema';
import { clearSessionCookie, createSession, destroyAllSessions, getCurrentUser } from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { isRateLimited, recordEvent } from '@/lib/auth/rate-limit';
import { removeObjects } from '@/lib/supabase/server';
import { isUuid } from '@/lib/storage-paths';
import {
  changePasswordSchema,
  deleteAccountSchema,
  firstError,
  gatePasswordChangeSchema,
} from '@/lib/validation/schemas';
import { str } from '@/lib/actions/helpers';
import type { ActionState } from '@/lib/actions/types';

const LOGIN_REQUIRED = { error: '로그인이 필요합니다.' };

export async function setTheme(theme: 'light' | 'dark'): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (theme !== 'light' && theme !== 'dark') return { error: '잘못된 테마입니다.' };
  await db
    .insert(userPreferences)
    .values({ userId: user.id, theme })
    .onConflictDoUpdate({ target: userPreferences.userId, set: { theme, updatedAt: new Date() } });
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  const parsed = changePasswordSchema.safeParse({
    currentPassword: str(fd, 'currentPassword'),
    newPassword: str(fd, 'newPassword'),
    newPasswordConfirm: str(fd, 'newPasswordConfirm'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const key = `pwchange:${user.id}`;
  if (await isRateLimited(key, 5)) return { error: '시도가 너무 많습니다. 15분 후 다시 시도해주세요.' };

  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(parsed.data.currentPassword, row.passwordHash))) {
    await recordEvent(key);
    return { error: '현재 비밀번호가 올바르지 않습니다.' };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
  // 다른 기기의 세션을 모두 끊고 현재 기기에 새 세션을 발급합니다.
  await destroyAllSessions(user.id);
  await createSession(user.id);
  return { ok: true, message: '비밀번호를 변경했습니다. 다른 기기에서는 다시 로그인해야 합니다.' };
}

export async function deleteAccount(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (user.role === 'admin') return { error: '관리자 계정은 삭제할 수 없습니다.' };

  const parsed = deleteAccountSchema.safeParse({
    password: str(fd, 'password'),
    passwordAgain: str(fd, 'passwordAgain'),
    phrase: str(fd, 'phrase'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const key = `delete:${user.id}`;
  if (await isRateLimited(key, 5)) return { error: '시도가 너무 많습니다. 15분 후 다시 시도해주세요.' };

  const [row] = await db
    .select({ passwordHash: users.passwordHash, avatarPath: users.avatarPath })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!row) return { error: '계정을 찾을 수 없습니다.' };

  // 두 입력값이 같다는 것은 스키마에서 확인했으므로, 둘 다 실제 비밀번호와 일치하는지 확인합니다.
  const [okA, okB] = await Promise.all([
    verifyPassword(parsed.data.password, row.passwordHash),
    verifyPassword(parsed.data.passwordAgain, row.passwordHash),
  ]);
  if (!okA || !okB) {
    await recordEvent(key);
    return { error: '비밀번호가 올바르지 않습니다.' };
  }

  const privateImages = await db
    .select({ storagePath: profileImages.storagePath })
    .from(profileImages)
    .where(eq(profileImages.userId, user.id));

  try {
    // neon-http의 batch는 하나의 트랜잭션으로 실행됩니다. 중간에 실패하면 전부 롤백됩니다.
    // users 삭제 시 sessions·환경설정·프로필 글/사진·추천은 CASCADE로 삭제되고,
    // 게시글·댓글·앨범·공지·일정은 작성자가 NULL(졸업생)로 익명화됩니다.
    await db.batch([
      db.insert(alumni).values({ name: user.name }),
      db.delete(sessions).where(eq(sessions.userId, user.id)),
      db.delete(users).where(eq(users.id, user.id)),
    ]);
  } catch (e) {
    console.error('[delete account]', e);
    return { error: '계정을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.' };
  }

  await removeObjects([row.avatarPath], false);
  await removeObjects(privateImages.map((i) => i.storagePath));
  await clearSessionCookie();
  redirect('/login?graduated=1');
}

/* ─────────────────────────── 관리자 전용 ─────────────────────────── */

export async function updateGatePassword(
  kind: 'notice' | 'calendar',
  _prev: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return { error: '관리자만 변경할 수 있습니다.' };
  if (kind !== 'notice' && kind !== 'calendar') return { error: '잘못된 요청입니다.' };

  const parsed = gatePasswordChangeSchema.safeParse({
    newPassword: str(fd, 'newPassword'),
    newPasswordConfirm: str(fd, 'newPasswordConfirm'),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const hash = await hashPassword(parsed.data.newPassword);
  await db
    .update(siteSettings)
    .set(kind === 'notice' ? { noticePasswordHash: hash, updatedAt: new Date() } : { calendarPasswordHash: hash, updatedAt: new Date() })
    .where(eq(siteSettings.id, 1));
  return {
    ok: true,
    message: kind === 'notice' ? '공지사항 비밀번호를 변경했습니다.' : '일정 추가 비밀번호를 변경했습니다.',
  };
}

export async function setUserRole(targetId: string, role: Role): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return { error: '관리자만 변경할 수 있습니다.' };
  if (!isUuid(targetId)) return { error: '잘못된 요청입니다.' };
  if (role !== 'student' && role !== 'teacher') return { error: '변경할 수 없는 역할입니다.' };
  if (targetId === user.id) return { error: '본인의 역할은 변경할 수 없습니다.' };

  const [target] = await db
    .select({ role: users.role, grade: users.grade })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);
  if (!target) return { error: '사용자를 찾을 수 없습니다.' };
  if (target.role === 'admin') return { error: '관리자 계정의 역할은 변경할 수 없습니다.' };
  if (role === 'student' && !target.grade) return { error: '학번 정보가 없는 계정은 학생으로 바꿀 수 없습니다.' };

  await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(and(eq(users.id, targetId), ne(users.role, 'admin')));
  revalidatePath('/members');
  revalidatePath('/settings');
  return { ok: true };
}
