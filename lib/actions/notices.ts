'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { checkGatePassword } from '@/lib/auth/gate';
import { isUuid } from '@/lib/storage-paths';
import { firstError, noticeSchema } from '@/lib/validation/schemas';
import { isStaff } from '@/lib/utils/student';
import { str } from '@/lib/actions/helpers';
import type { ActionState } from '@/lib/actions/types';

function readNotice(fd: FormData) {
  return noticeSchema.safeParse({
    title: str(fd, 'title'),
    content: str(fd, 'content'),
    pinned: fd.get('pinned') === 'on',
  });
}

export async function createNotice(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const parsed = readNotice(fd);
  if (!parsed.success) return { error: firstError(parsed.error) };

  // 서버에서 해시와 비교합니다. 교사·관리자는 비밀번호가 필요 없습니다.
  const gate = await checkGatePassword(user, 'notice', fd.get('gatePassword'));
  if (!gate.ok) return { error: gate.error };

  const [created] = await db
    .insert(notices)
    .values({
      ...parsed.data,
      // 고정 공지는 교사·관리자만 지정할 수 있습니다.
      pinned: isStaff(user.role) ? parsed.data.pinned : false,
      authorId: user.id,
    })
    .returning({ id: notices.id });

  revalidatePath('/notices');
  revalidatePath('/home');
  redirect(`/notices/${created.id}`);
}

async function loadEditable(noticeId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: '로그인이 필요합니다.' } as const;
  if (!isUuid(noticeId)) return { error: '잘못된 요청입니다.' } as const;
  const [notice] = await db.select({ authorId: notices.authorId }).from(notices).where(eq(notices.id, noticeId)).limit(1);
  if (!notice) return { error: '공지를 찾을 수 없습니다.' } as const;
  if (notice.authorId !== user.id && user.role !== 'admin') return { error: '권한이 없습니다.' } as const;
  return { user } as const;
}

export async function updateNotice(noticeId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const check = await loadEditable(noticeId);
  if ('error' in check) return { error: check.error };
  const parsed = readNotice(fd);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const values: Partial<typeof notices.$inferInsert> = {
    title: parsed.data.title,
    content: parsed.data.content,
    updatedAt: new Date(),
  };
  if (isStaff(check.user.role)) values.pinned = parsed.data.pinned;

  await db.update(notices).set(values).where(eq(notices.id, noticeId));
  revalidatePath('/notices');
  revalidatePath(`/notices/${noticeId}`);
  redirect(`/notices/${noticeId}`);
}

export async function deleteNotice(noticeId: string): Promise<ActionState> {
  const check = await loadEditable(noticeId);
  if ('error' in check) return { error: check.error };
  await db.delete(notices).where(eq(notices.id, noticeId));
  revalidatePath('/notices');
  revalidatePath('/home');
  redirect('/notices');
}
