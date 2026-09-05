'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';
import { isStaff, requireAdminOrThrow, requireUserOrThrow } from '@/lib/auth/guard';
import { checkThrottle, clearFailures, recordFailure } from '@/lib/auth/rate-limit';
import { verifyNoticePassword } from '@/lib/settings';
import { noticeSchema } from '@/lib/validation/schemas';
import {
  fail,
  succeed,
  toActionError,
  UserFacingError,
  zodToFieldErrors,
  type ActionResult,
} from '@/lib/utils/errors';

/**
 * The teacher password is only ever compared against a bcrypt hash on the
 * server. Nothing about it — not the value, not its length — reaches the client.
 */
async function assertNoticePermission(userId: string, staff: boolean, candidate: string) {
  if (staff) return;

  const key = `notice:${userId}`;
  const throttle = await checkThrottle(key);
  if (throttle.locked) {
    const minutes = Math.ceil(throttle.retryAfterSeconds / 60);
    throw new UserFacingError(`비밀번호를 여러 번 틀렸습니다. ${minutes}분 후에 다시 시도해 주세요.`);
  }

  if (!candidate || !(await verifyNoticePassword(candidate))) {
    await recordFailure(key);
    throw new UserFacingError('공지 작성 비밀번호가 올바르지 않습니다.');
  }

  await clearFailures(key);
}

export async function createNotice(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUserOrThrow();

    const parsed = noticeSchema.safeParse({
      title: formData.get('title'),
      content: formData.get('content'),
      pinned: formData.get('pinned') === 'on' || formData.get('pinned') === 'true',
      password: formData.get('password') ?? '',
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    // Only admins and teachers may pin.
    const staff = isStaff(user);
    await assertNoticePermission(user.id, staff, parsed.data.password);

    const [notice] = await db
      .insert(notices)
      .values({
        authorId: user.id,
        authorName: user.name,
        title: parsed.data.title,
        content: parsed.data.content,
        pinned: staff ? parsed.data.pinned : false,
      })
      .returning({ id: notices.id });

    revalidatePath('/notices');
    revalidatePath('/home');
    return succeed({ id: notice.id }, '공지를 올렸습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateNotice(
  noticeId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ authorId: notices.authorId })
      .from(notices)
      .where(eq(notices.id, noticeId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('공지를 찾을 수 없습니다.');

    const staff = isStaff(user);
    if (!staff && existing.authorId !== user.id) {
      return fail('내가 쓴 공지만 수정할 수 있습니다.');
    }

    const parsed = noticeSchema.safeParse({
      title: formData.get('title'),
      content: formData.get('content'),
      pinned: formData.get('pinned') === 'on' || formData.get('pinned') === 'true',
      password: formData.get('password') ?? '',
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    await assertNoticePermission(user.id, staff, parsed.data.password);

    await db
      .update(notices)
      .set({
        title: parsed.data.title,
        content: parsed.data.content,
        pinned: staff ? parsed.data.pinned : false,
        updatedAt: new Date(),
      })
      .where(eq(notices.id, noticeId));

    revalidatePath('/notices');
    revalidatePath(`/notices/${noticeId}`);
    return succeed({ id: noticeId }, '공지를 수정했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteNotice(noticeId: string): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ authorId: notices.authorId })
      .from(notices)
      .where(eq(notices.id, noticeId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('공지를 찾을 수 없습니다.');

    if (!isStaff(user) && existing.authorId !== user.id) {
      return fail('내가 쓴 공지만 삭제할 수 있습니다.');
    }

    await db.delete(notices).where(eq(notices.id, noticeId));

    revalidatePath('/notices');
    revalidatePath('/home');
    return succeed(undefined, '공지를 삭제했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function togglePinned(noticeId: string): Promise<ActionResult> {
  try {
    await requireAdminOrThrow();

    const rows = await db
      .select({ pinned: notices.pinned })
      .from(notices)
      .where(eq(notices.id, noticeId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('공지를 찾을 수 없습니다.');

    await db.update(notices).set({ pinned: !existing.pinned }).where(eq(notices.id, noticeId));

    revalidatePath('/notices');
    return succeed(undefined, existing.pinned ? '고정을 해제했습니다.' : '위에 고정했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}
