import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { UserFacingError } from '@/lib/utils/errors';

const SETTINGS_ID = 1;

async function loadSettings() {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, SETTINGS_ID)).limit(1);
  const row = rows[0];
  if (!row) {
    throw new UserFacingError('사이트 설정이 아직 준비되지 않았습니다. 관리자에게 알려 주세요.');
  }
  return row;
}

/**
 * The shared notice/calendar passwords never leave the server: the client posts
 * a candidate and only gets back a boolean.
 */
export async function verifyNoticePassword(candidate: string): Promise<boolean> {
  const settings = await loadSettings();
  return verifyPassword(candidate, settings.noticePasswordHash);
}

export async function verifyCalendarPassword(candidate: string): Promise<boolean> {
  const settings = await loadSettings();
  return verifyPassword(candidate, settings.calendarPasswordHash);
}

export async function updateSitePassword(
  target: 'notice' | 'calendar',
  newPassword: string,
): Promise<void> {
  const hash = await hashPassword(newPassword);
  await db
    .update(siteSettings)
    .set(
      target === 'notice'
        ? { noticePasswordHash: hash, updatedAt: new Date() }
        : { calendarPasswordHash: hash, updatedAt: new Date() },
    )
    .where(eq(siteSettings.id, SETTINGS_ID));
}

export async function settingsUpdatedAt(): Promise<Date> {
  return (await loadSettings()).updatedAt;
}
