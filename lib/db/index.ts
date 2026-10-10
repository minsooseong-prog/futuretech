import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type Db = NeonHttpDatabase<typeof schema>;

// Neon HTTP 드라이버는 요청마다 TCP 연결을 열지 않고 fetch로 쿼리를 보내므로
// Vercel 서버리스 환경에서 연결 고갈 문제가 없습니다.
const globalForDb = globalThis as unknown as { __futureTechDb?: Db };

function getDb(): Db {
  if (!globalForDb.__futureTechDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
    globalForDb.__futureTechDb = drizzle(neon(url), { schema });
  }
  return globalForDb.__futureTechDb;
}

// 빌드 시점에 환경변수가 없어도 모듈 로드가 실패하지 않도록 지연 초기화합니다.
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

export { schema };
