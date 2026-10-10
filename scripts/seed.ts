/**
 * 초기 데이터 생성 (여러 번 실행해도 안전 / idempotent)
 * - 관리자 계정: 학번 00000, 이름 N, 비밀번호 NNNNN (bcrypt 해시로 저장)
 * - 사이트 설정: 공지/일정 비밀번호 기본값 00000 (해시로 저장)
 * - Supabase Storage 비공개 버킷 생성
 */
import { requireEnv } from './env';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { siteSettings, userPreferences, users } from '../lib/db/schema';

const BUCKET = 'future-tech';
const ROUNDS = 12;

async function seedDatabase() {
  const db = drizzle(neon(requireEnv('DATABASE_URL')));

  const [existingAdmin] = await db.select({ id: users.id }).from(users).where(eq(users.studentId, '00000')).limit(1);
  if (existingAdmin) {
    console.log('• 관리자 계정이 이미 있습니다. 건너뜁니다.');
  } else {
    const inserted = await db
      .insert(users)
      .values({
        studentId: '00000',
        name: 'N',
        passwordHash: await hash('NNNNN', ROUNDS),
        role: 'admin',
        grade: null,
        classNumber: null,
        studentNumber: null,
      })
      .onConflictDoNothing({ target: users.studentId })
      .returning({ id: users.id });
    if (inserted[0]) {
      await db.insert(userPreferences).values({ userId: inserted[0].id, theme: 'light' }).onConflictDoNothing();
      console.log('✓ 관리자 계정 생성 (학번 00000 / 이름 N)');
    }
  }

  const result = await db
    .insert(siteSettings)
    .values({
      id: 1,
      noticePasswordHash: await hash('00000', ROUNDS),
      calendarPasswordHash: await hash('00000', ROUNDS),
    })
    .onConflictDoNothing({ target: siteSettings.id })
    .returning({ id: siteSettings.id });
  console.log(result.length ? '✓ 사이트 기본 설정 생성' : '• 사이트 설정이 이미 있습니다. 건너뜁니다.');
}

async function seedStorage() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('• Supabase 환경변수가 없어 버킷 생성을 건너뜁니다. README의 수동 설정을 따르세요.');
    return;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('✗ 버킷 목록 조회 실패:', error.message);
    return;
  }
  const options = {
    public: false,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/webp', 'image/jpeg'],
  };
  if (buckets?.some((b) => b.name === BUCKET)) {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, options);
    if (updateError) console.error('✗ 버킷 설정 갱신 실패:', updateError.message);
    else console.log(`• 버킷 '${BUCKET}' 확인 (비공개, 5MB, WebP/JPEG만 허용)`);
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(BUCKET, options);
  if (createError) console.error('✗ 버킷 생성 실패:', createError.message);
  else console.log(`✓ 비공개 버킷 '${BUCKET}' 생성`);
}

async function main() {
  await seedDatabase();
  await seedStorage();
  console.log('\n완료. 관리자 계정으로 로그인한 뒤 설정에서 비밀번호를 꼭 바꿔주세요.');
}

main().catch((e) => {
  console.error('✗ 시드 실패:', e);
  process.exit(1);
});
