import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { verifyPassword } from '@/lib/auth/password';
import { clearEvents, isRateLimited, recordEvent } from '@/lib/auth/rate-limit';
import type { SessionUser } from '@/lib/auth/session';
import { isStaff } from '@/lib/utils/student';

/**
 * 공지 작성 / 일정 추가용 비밀번호 확인.
 * 교사·관리자는 비밀번호 없이 통과합니다. 해시는 서버에서만 읽습니다.
 */
export async function checkGatePassword(
  user: SessionUser,
  kind: 'notice' | 'calendar',
  password: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isStaff(user.role)) return { ok: true };

  const key = `gate:${kind}:${user.id}`;
  if (await isRateLimited(key, 5)) {
    return { ok: false, error: '비밀번호를 너무 많이 틀렸습니다. 15분 후 다시 시도해주세요.' };
  }
  if (typeof password !== 'string' || password.length === 0 || password.length > 72) {
    return { ok: false, error: '비밀번호를 입력해주세요.' };
  }

  const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  if (!settings) return { ok: false, error: '사이트 설정이 초기화되지 않았습니다. 관리자에게 문의하세요.' };

  const hash = kind === 'notice' ? settings.noticePasswordHash : settings.calendarPasswordHash;
  if (!(await verifyPassword(password, hash))) {
    await recordEvent(key);
    return { ok: false, error: '비밀번호가 올바르지 않습니다.' };
  }
  await clearEvents(key);
  return { ok: true };
}
