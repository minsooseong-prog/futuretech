'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { checkGatePassword } from '@/lib/auth/gate';
import { isUuid } from '@/lib/storage-paths';
import { calendarEventSchema, firstError } from '@/lib/validation/schemas';
import { str } from '@/lib/actions/helpers';
import type { ActionState } from '@/lib/actions/types';

export async function createCalendarEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: '로그인이 필요합니다.' };

  const allDay = fd.get('allDay') === 'on';
  const parsed = calendarEventSchema.safeParse({
    title: str(fd, 'title'),
    description: str(fd, 'description'),
    startDate: str(fd, 'startDate'),
    endDate: str(fd, 'endDate') || str(fd, 'startDate'),
    allDay,
    startTime: allDay ? null : str(fd, 'startTime') || null,
    endTime: allDay ? null : str(fd, 'endTime') || null,
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const gate = await checkGatePassword(user, 'calendar', fd.get('gatePassword'));
  if (!gate.ok) return { error: gate.error };

  await db.insert(calendarEvents).values({ ...parsed.data, createdBy: user.id });
  revalidatePath('/calendar');
  revalidatePath('/home');
  return { ok: true, message: '일정을 추가했습니다.' };
}

export async function deleteCalendarEvent(eventId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: '로그인이 필요합니다.' };
  if (!isUuid(eventId)) return { error: '잘못된 요청입니다.' };
  const [event] = await db
    .select({ createdBy: calendarEvents.createdBy })
    .from(calendarEvents)
    .where(eq(calendarEvents.id, eventId))
    .limit(1);
  if (!event) return { error: '일정을 찾을 수 없습니다.' };
  if (event.createdBy !== user.id && user.role !== 'admin') return { error: '삭제 권한이 없습니다.' };
  await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));
  revalidatePath('/calendar');
  revalidatePath('/home');
  return { ok: true };
}
