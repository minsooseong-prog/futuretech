'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { canManage, isStaff, requireUserOrThrow } from '@/lib/auth/guard';
import { checkThrottle, clearFailures, recordFailure } from '@/lib/auth/rate-limit';
import { verifyCalendarPassword } from '@/lib/settings';
import { calendarEventSchema } from '@/lib/validation/schemas';
import {
  fail,
  succeed,
  toActionError,
  UserFacingError,
  zodToFieldErrors,
  type ActionResult,
} from '@/lib/utils/errors';

async function assertCalendarPermission(userId: string, staff: boolean, candidate: string) {
  if (staff) return;

  const key = `calendar:${userId}`;
  const throttle = await checkThrottle(key);
  if (throttle.locked) {
    const minutes = Math.ceil(throttle.retryAfterSeconds / 60);
    throw new UserFacingError(`비밀번호를 여러 번 틀렸습니다. ${minutes}분 후에 다시 시도해 주세요.`);
  }

  if (!candidate || !(await verifyCalendarPassword(candidate))) {
    await recordFailure(key);
    throw new UserFacingError('일정 추가 비밀번호가 올바르지 않습니다.');
  }

  await clearFailures(key);
}

function readForm(formData: FormData) {
  const allDay = formData.get('allDay') === 'on' || formData.get('allDay') === 'true';
  return {
    title: formData.get('title'),
    description: formData.get('description') ?? '',
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate') || formData.get('startDate'),
    allDay,
    startTime: allDay ? '' : (formData.get('startTime') ?? ''),
    endTime: allDay ? '' : (formData.get('endTime') ?? ''),
    password: formData.get('password') ?? '',
  };
}

export async function createCalendarEvent(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUserOrThrow();

    const parsed = calendarEventSchema.safeParse(readForm(formData));
    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    await assertCalendarPermission(user.id, isStaff(user), parsed.data.password);

    const [event] = await db
      .insert(calendarEvents)
      .values({
        title: parsed.data.title,
        description: parsed.data.description || null,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        allDay: parsed.data.allDay,
        startTime: parsed.data.allDay ? null : parsed.data.startTime || null,
        endTime: parsed.data.allDay ? null : parsed.data.endTime || null,
        createdBy: user.id,
        createdByName: user.name,
      })
      .returning({ id: calendarEvents.id });

    revalidatePath('/calendar');
    revalidatePath('/home');
    return succeed({ id: event.id }, '일정을 추가했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ createdBy: calendarEvents.createdBy })
      .from(calendarEvents)
      .where(eq(calendarEvents.id, eventId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('일정을 찾을 수 없습니다.');

    // Staff can tidy the shared class calendar; students only their own entries.
    if (!isStaff(user) && !canManage(user, existing.createdBy)) {
      return fail('내가 추가한 일정만 삭제할 수 있습니다.');
    }

    await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));

    revalidatePath('/calendar');
    revalidatePath('/home');
    return succeed(undefined, '일정을 삭제했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}
