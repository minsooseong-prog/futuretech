import 'server-only';
import { compare, hash } from 'bcryptjs';

const ROUNDS = 12;

export const hashPassword = (plain: string) => hash(plain, ROUNDS);

export const verifyPassword = (plain: string, passwordHash: string) => compare(plain, passwordHash);

// 존재하지 않는 계정에도 같은 시간이 걸리도록 비교용 더미 해시를 사용합니다.
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(plain: string) {
  dummyHash ??= hash('future-tech-dummy-password', ROUNDS);
  await compare(plain, await dummyHash);
  return false;
}
