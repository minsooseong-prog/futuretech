import { ZodError } from 'zod';

/**
 * Thrown when the message is meant for the person on the other side of the
 * screen. Anything else that escapes an action is logged and replaced with a
 * generic line, so a Postgres or Supabase error never reaches a student.
 */
export class UserFacingError extends Error {
  override name = 'UserFacingError';
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function succeed<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function zodToFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Turns anything thrown inside a server action into a message a student can read. */
export function toActionError(err: unknown): ActionResult<never> {
  if (err instanceof ZodError) {
    const fieldErrors = zodToFieldErrors(err);
    return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
  }
  // AuthError is matched by name so this module needs no server-only import
  // and can be shared with client components.
  if (err instanceof Error && (err.name === 'AuthError' || err.name === 'UserFacingError')) {
    return fail(err.message);
  }
  if (err instanceof Error) {
    console.error('[action]', err);
    return fail('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  console.error('[action] unknown error', err);
  return fail('요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
}
