import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { siteSettings, userPreferences, users } from '../lib/db/schema';

/**
 * Idempotent. Running it twice never creates a second administrator and never
 * resets a password that has already been changed.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
  }

  const db = drizzle(neon(process.env.DATABASE_URL));

  const adminStudentId = process.env.ADMIN_STUDENT_ID || '00000';
  const adminName = process.env.ADMIN_NAME || 'N';
  const adminPassword = process.env.ADMIN_PASSWORD || 'NNNNN';
  const noticePassword = process.env.DEFAULT_NOTICE_PASSWORD || '00000';
  const calendarPassword = process.env.DEFAULT_CALENDAR_PASSWORD || '00000';

  /* --- Administrator ------------------------------------------------ */

  const existingAdmin = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.studentId, adminStudentId))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log(`Administrator ${adminStudentId} already exists — left untouched.`);
  } else {
    // The plaintext password is hashed here and never written to the database.
    const [admin] = await db
      .insert(users)
      .values({
        studentId: adminStudentId,
        name: adminName,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: 'admin',
        // 00000 is not a student ID, so grade/class/number stay null.
        grade: null,
        classNumber: null,
        studentNumber: null,
        bio: '미래공학 담당',
      })
      .returning({ id: users.id });

    await db.insert(userPreferences).values({ userId: admin.id }).onConflictDoNothing();
    console.log(`Administrator created: ${adminName} (${adminStudentId})`);
  }

  /* --- Shared notice / calendar passwords ---------------------------- */

  const existingSettings = await db
    .select({ id: siteSettings.id })
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);

  if (existingSettings.length > 0) {
    console.log('Site settings already exist — passwords left untouched.');
  } else {
    await db.insert(siteSettings).values({
      id: 1,
      noticePasswordHash: await bcrypt.hash(noticePassword, 12),
      calendarPasswordHash: await bcrypt.hash(calendarPassword, 12),
    });
    console.log('Site settings created (notice + calendar passwords stored as hashes).');
  }

  console.log('\nSeed complete.');
  console.log('  Sign in as the administrator with the name, student ID and password above,');
  console.log('  then change the password in 설정 → 계정 straight away.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
