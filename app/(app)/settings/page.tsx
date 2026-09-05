import type { Metadata } from 'next';
import Link from 'next/link';
import { asc, eq } from 'drizzle-orm';
import { LogOut, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import { PasswordForm } from '@/components/settings/password-form';
import { RoleManager, SitePasswordForm, type ManagedUser } from '@/components/settings/admin-panel';
import { DeleteAccountForm } from '@/components/settings/delete-account';
import { logoutAction } from '@/actions/auth';
import { db } from '@/lib/db';
import { userPreferences, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guard';
import { formatClassInfo, roleLabel } from '@/lib/utils/student-id';

export const metadata: Metadata = { title: '설정 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireUser();
  const isAdmin = user.role === 'admin';

  const prefRows = await db
    .select({ theme: userPreferences.theme })
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);

  const theme = prefRows[0]?.theme === 'dark' ? 'dark' : 'light';

  let managed: ManagedUser[] = [];
  if (isAdmin) {
    managed = await db
      .select({
        id: users.id,
        name: users.name,
        studentId: users.studentId,
        role: users.role,
        grade: users.grade,
        classNumber: users.classNumber,
        studentNumber: users.studentNumber,
        avatarPath: users.avatarPath,
      })
      .from(users)
      .orderBy(asc(users.grade), asc(users.classNumber), asc(users.studentNumber), asc(users.name));
  }

  const detail =
    user.role === 'student'
      ? formatClassInfo(user.grade, user.classNumber, user.studentNumber)
      : roleLabel(user.role);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="설정" />

      <Card>
        <CardHeader title="계정" />
        <CardBody className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="mt-0.5 text-[13px] text-subtle">
                {detail} · 학번 {user.studentId}
              </p>
            </div>
            <Link
              href={`/profile/${user.id}`}
              className="inline-flex h-9 items-center rounded-xl border border-line px-3.5 text-[13px] text-subtle transition hover:text-ink"
            >
              프로필 관리
            </Link>
          </div>

          <div className="border-t border-line pt-5">
            <h3 className="mb-4 text-[13px] font-medium text-subtle">비밀번호 변경</h3>
            <PasswordForm />
          </div>

          <form action={logoutAction} className="border-t border-line pt-5">
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-line px-3.5 text-[13px] text-subtle transition hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              로그아웃
            </button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="화면" />
        <CardBody>
          <p className="mb-4 text-[13px] text-subtle">기기마다 저장되지 않고 계정에 저장됩니다.</p>
          <ThemeToggle current={theme} />
        </CardBody>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                관리자 설정
              </span>
            }
          />
          <CardBody className="space-y-8">
            <section>
              <h3 className="mb-3 text-[13px] font-medium text-subtle">공지사항 비밀번호 변경</h3>
              <SitePasswordForm
                target="notice"
                description="학생이 공지를 작성할 때 입력하는 비밀번호입니다. 해시로만 저장되며 현재 값은 다시 볼 수 없습니다."
              />
            </section>

            <section className="border-t border-line pt-8">
              <h3 className="mb-3 text-[13px] font-medium text-subtle">
                캘린더 일정 추가 비밀번호 변경
              </h3>
              <SitePasswordForm
                target="calendar"
                description="학생이 일정을 추가할 때 입력하는 비밀번호입니다. 해시로만 저장됩니다."
              />
            </section>

            <section className="border-t border-line pt-8">
              <h3 className="mb-1 text-[13px] font-medium text-subtle">역할 관리</h3>
              <p className="mb-4 text-[13px] text-subtle">
                교사로 지정하면 비밀번호 없이 공지와 일정을 올릴 수 있고, 반 친구들 화면의 교사 항목에
                표시됩니다.
              </p>
              <RoleManager people={managed} />
            </section>
          </CardBody>
        </Card>
      )}

      {!isAdmin && (
        <Card className="border-danger/30">
          <CardHeader title={<span className="text-danger">계정 삭제 (졸업)</span>} />
          <CardBody className="space-y-5">
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-[13px] leading-relaxed text-danger">
              계정을 삭제하면 올린 글, 사진, 댓글이 모두 지워집니다. 졸업생 목록에는 이름과 졸업한
              날짜만 남습니다. 되돌릴 수 없습니다.
            </div>
            <DeleteAccountForm />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
