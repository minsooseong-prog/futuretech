import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { loginAttempts } from '@/lib/db/schema';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 10;

export type ThrottleState = { locked: boolean; retryAfterSeconds: number };

/**
 * Counter-based throttling backed by Postgres rather than in-memory state —
 * serverless functions do not share memory between invocations.
 */
export async function checkThrottle(identifier: string): Promise<ThrottleState> {
  const key = identifier.slice(0, 80);
  const rows = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.identifier, key))
    .limit(1);

  const row = rows[0];
  if (!row?.lockedUntil) return { locked: false, retryAfterSeconds: 0 };

  const remaining = row.lockedUntil.getTime() - Date.now();
  if (remaining <= 0) {
    // Lock expired — start the user from a clean slate rather than re-locking
    // them on their very next mistake.
    await db.delete(loginAttempts).where(eq(loginAttempts.identifier, key));
    return { locked: false, retryAfterSeconds: 0 };
  }

  return { locked: true, retryAfterSeconds: Math.ceil(remaining / 1000) };
}

export async function recordFailure(identifier: string): Promise<void> {
  const key = identifier.slice(0, 80);
  await db
    .insert(loginAttempts)
    .values({ identifier: key, attempts: 1, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: loginAttempts.identifier,
      set: {
        attempts: sql`${loginAttempts.attempts} + 1`,
        updatedAt: new Date(),
        lockedUntil: sql`CASE WHEN ${loginAttempts.attempts} + 1 >= ${MAX_ATTEMPTS}
          THEN now() + interval '${sql.raw(String(LOCK_MINUTES))} minutes'
          ELSE ${loginAttempts.lockedUntil} END`,
      },
    });
}

export async function clearFailures(identifier: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.identifier, identifier.slice(0, 80)));
}

export { MAX_ATTEMPTS, LOCK_MINUTES };
