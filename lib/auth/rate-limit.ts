import 'server-only';
import { headers } from 'next/headers';
import { and, count, eq, gt, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { rateLimitEvents } from '@/lib/db/schema';

const MINUTE = 60 * 1000;

export async function isRateLimited(key: string, max: number, windowMs = 15 * MINUTE) {
  const since = new Date(Date.now() - windowMs);
  const [row] = await db
    .select({ n: count() })
    .from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.key, key), gt(rateLimitEvents.createdAt, since)));
  return (row?.n ?? 0) >= max;
}

export async function recordEvent(key: string) {
  await db.insert(rateLimitEvents).values({ key });
  // 하루 지난 기록은 정리합니다.
  if (Math.random() < 0.05) {
    await db.delete(rateLimitEvents).where(lt(rateLimitEvents.createdAt, new Date(Date.now() - 24 * 60 * MINUTE)));
  }
}

export async function clearEvents(key: string) {
  await db.delete(rateLimitEvents).where(eq(rateLimitEvents.key, key));
}

export async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}
