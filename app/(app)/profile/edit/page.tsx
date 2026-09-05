import type { Metadata } from 'next';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guard';
import { formatClassInfo, roleLabel } from '@/lib/utils/student-id';

export const metadata: Metadata = { title: '프로필 편집 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function ProfileEditPage() {
  const user = await requireUser();

  const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const profile = rows[0];

  const detail =
    profile.role === 'student'
      ? formatClassInfo(profile.grade, profile.classNumber, profile.studentNumber)
      : roleLabel(profile.role);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="프로필 편집" />

      <Card>
        <CardBody className="space-y-6">
          <div className="rounded-xl border border-line bg-canvas p-4 text-sm">
            <p className="font-medium">
              {profile.name} · {detail}
            </p>
            <p className="mt-1 text-[13px] text-subtle">
              학년, 반, 번호는 학번으로 정해집니다. 잘못 등록되었다면 관리자에게 알려 주세요.
            </p>
          </div>

          <ProfileEditForm bio={profile.bio ?? ''} />

          <p className="border-t border-line pt-4 text-[13px] text-subtle">
            프로필 사진은{' '}
            <Link href={`/profile/${user.id}`} className="text-ink underline underline-offset-4">
              내 미니홈
            </Link>
            에서 바꿀 수 있습니다.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
