import { requireEnv } from './env';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

async function main() {
  const db = drizzle(neon(requireEnv('DATABASE_URL')));
  console.log('→ 마이그레이션 적용 중...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✓ 마이그레이션 완료');
}

main().catch((e) => {
  console.error('✗ 마이그레이션 실패:', e);
  process.exit(1);
});
