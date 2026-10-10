import { config } from 'dotenv';

config({ path: '.env.local' });
config();

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    console.error(`✗ ${name} 환경변수가 없습니다. .env.local을 확인하세요.`);
    process.exit(1);
  }
  return value;
}
