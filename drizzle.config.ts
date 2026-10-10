import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });
config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 환경변수가 필요합니다. .env.local을 확인하세요.');
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
