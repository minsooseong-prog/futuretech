import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser, type SessionUser } from './session';

/** Every protected page and every mutating action goes through one of these. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/home');
  return user;
}

/** Action-safe variants: they throw instead of redirecting. */
export class AuthError extends Error {
  override name = 'AuthError';
}

export async function requireUserOrThrow(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('로그인이 필요합니다.');
  return user;
}

export async function requireAdminOrThrow(): Promise<SessionUser> {
  const user = await requireUserOrThrow();
  if (user.role !== 'admin') throw new AuthError('관리자만 사용할 수 있습니다.');
  return user;
}

export function canManage(user: SessionUser, ownerId: string | null | undefined): boolean {
  return user.role === 'admin' || (!!ownerId && ownerId === user.id);
}

/** Notices and calendar entries are open to staff without the shared password. */
export function isStaff(user: SessionUser): boolean {
  return user.role === 'admin' || user.role === 'teacher';
}
