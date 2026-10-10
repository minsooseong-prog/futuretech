import type { Metadata } from 'next';
import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { logoutAction } from '@/lib/actions/auth';
import { formatStudentInfo } from '@/lib/utils/student';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordChangeForm } from '@/components/settings/PasswordChangeForm';
import { ThemeForm } from '@/components/settings/ThemeForm';
import { DeleteAccountForm } from '@/components/settings/DeleteAccountForm';
import { GatePasswordForm } from '@/components/settings/GatePasswordForm';
import { RoleManager } from '@/components/settings/RoleManager';

export const metadata: Metadata = { title: '설정' };

function Block({ title, description, children, tone }: { title: string; description?: string; children: React.ReactNode; tone?: 'danger' }) {
  return (
    <section className={tone === 'danger' ? 'rounded-xl border border-danger/40 bg-card p-5 md:p-6' : 'card p-5 md:p-6'}>
      <h2 className={tone === 'danger' ? 'section-title text-danger' : 'section-title'}>{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const isAdmin = user.role === 'admin';

  const allUsers = isAdmin
    ? await db
        .select({ id: users.id, name: users.name, studentId: users.studentId, role: users.role, grade: users.grade, classNumber: users.classNumber, studentNumber: users.studentNumber })
        .from(users)
        .orderBy(asc(users.studentId))
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="설정" />

      <Block title="계정" description={`${user.name}  ${formatStudentInfo(user)}  학번 ${user.studentId}`}>
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/profile/edit" className="btn-secondary">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            프로필 관리
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-secondary">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              로그아웃
            </button>
          </form>
        </div>
        <PasswordChangeForm />
      </Block>

      <Block title="화면" description="선택한 테마는 다음 접속 때도 유지됩니다.">
        <ThemeForm current={user.theme} />
      </Block>

      {isAdmin && (
        <Block title="관리자 설정" description="이 영역은 관리자에게만 보이며, 모든 변경은 서버에서 관리자 권한을 다시 확인합니다.">
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-subtle px-3 py-2 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            비밀번호는 해시로만 저장되어 현재 값을 확인할 수 없습니다. 새 값으로 덮어쓸 수만 있습니다.
          </div>
          <div className="space-y-8">
            <GatePasswordForm kind="notice" title="공지사항 비밀번호 변경" />
            <div className="border-t border-line" />
            <GatePasswordForm kind="calendar" title="일정 추가 비밀번호 변경" />
            <div className="border-t border-line" />
            <RoleManager users={allUsers.map((u) => ({ id: u.id, name: u.name, studentId: u.studentId, role: u.role, info: formatStudentInfo(u) }))} />
            <div className="border-t border-line" />
            <div className="text-sm">
              <h3 className="mb-2 font-semibold">시스템 구성</h3>
              <dl className="grid grid-cols-[8rem_1fr] gap-y-1.5 text-xs">
                <dt className="text-muted">데이터베이스</dt>
                <dd>Neon PostgreSQL ({process.env.DATABASE_URL ? '연결됨' : '미설정'})</dd>
                <dt className="text-muted">파일 저장소</dt>
                <dd>Supabase Storage, 비공개 버킷 ({process.env.SUPABASE_SERVICE_ROLE_KEY ? '연결됨' : '미설정'})</dd>
                <dt className="text-muted">등록 사용자</dt>
                <dd>{allUsers.length}명</dd>
                <dt className="text-muted">실행 환경</dt>
                <dd>{process.env.VERCEL ? `Vercel (${process.env.VERCEL_ENV ?? 'unknown'})` : process.env.NODE_ENV}</dd>
              </dl>
            </div>
          </div>
        </Block>
      )}

      {!isAdmin && (
        <Block
          tone="danger"
          title="계정 삭제 (졸업)"
          description="계정을 삭제하면 이름만 졸업생 목록에 남고 로그인 정보와 개인 사진은 모두 지워집니다."
        >
          <DeleteAccountForm />
        </Block>
      )}
    </div>
  );
}
