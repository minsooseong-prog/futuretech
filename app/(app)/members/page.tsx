import type { Metadata } from 'next';
import Link from 'next/link';
import { asc, desc } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { db } from '@/lib/db';
import { alumni, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guard';
import { formatDate } from '@/lib/utils/date';
import { formatClassInfo } from '@/lib/utils/student-id';

export const metadata: Metadata = { title: '반 친구들 · Future Tech' };
export const dynamic = 'force-dynamic';

type Member = {
  id: string;
  name: string;
  avatarPath: string | null;
  detail: string;
};

export default async function MembersPage() {
  await requireUser();

  const [people, graduates] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        grade: users.grade,
        classNumber: users.classNumber,
        studentNumber: users.studentNumber,
        avatarPath: users.avatarPath,
      })
      .from(users)
      .orderBy(asc(users.grade), asc(users.classNumber), asc(users.studentNumber), asc(users.name)),
    db.select().from(alumni).orderBy(desc(alumni.graduatedAt)).limit(200),
  ]);

  // Students are grouped by the grade digit of their student ID; teachers and
  // the administrator share the 교사 section.
  const byGrade = (grade: number): Member[] =>
    people
      .filter((p) => p.role === 'student' && p.grade === grade)
      .map((p) => ({
        id: p.id,
        name: p.name,
        avatarPath: p.avatarPath,
        detail: formatClassInfo(p.grade, p.classNumber, p.studentNumber),
      }));

  const staff: Member[] = people
    .filter((p) => p.role === 'teacher' || p.role === 'admin')
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatarPath: p.avatarPath,
      detail: p.role === 'admin' ? '관리자' : '교사',
    }));

  const sections: { title: string; members: Member[] }[] = [
    { title: '1학년', members: byGrade(1) },
    { title: '2학년', members: byGrade(2) },
    { title: '3학년', members: byGrade(3) },
    { title: '교사', members: staff },
  ];

  const anyone = sections.some((s) => s.members.length > 0) || graduates.length > 0;

  return (
    <>
      <PageHeader title="반 친구들" description={`${people.length}명이 함께하고 있습니다.`} />

      {!anyone ? (
        <EmptyState title="아직 등록된 사람이 없습니다." />
      ) : (
        <div className="space-y-9">
          {sections.map((section) =>
            section.members.length === 0 ? null : (
              <section key={section.title}>
                <h2 className="mb-3 flex items-baseline gap-2 border-b border-line pb-2 text-[15px] font-semibold tracking-tight">
                  {section.title}
                  <span className="text-[12px] font-normal tabular-nums text-faint">
                    {section.members.length}명
                  </span>
                </h2>

                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.members.map((member) => (
                    <li key={member.id}>
                      <Link
                        href={`/profile/${member.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:bg-canvas"
                      >
                        <Avatar name={member.name} path={member.avatarPath} size="md" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{member.name}</p>
                          <p className="mt-0.5 text-[12px] text-faint">{member.detail}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}

          {graduates.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-baseline gap-2 border-b border-line pb-2 text-[15px] font-semibold tracking-tight">
                졸업생
                <span className="text-[12px] font-normal tabular-nums text-faint">
                  {graduates.length}명
                </span>
              </h2>

              {/* No links: the accounts are gone, only the names remain. */}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {graduates.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-4"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-xs text-faint">
                      {person.name.slice(-2)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-subtle">{person.name}</p>
                      <p className="mt-0.5 text-[12px] text-faint">
                        {formatDate(person.graduatedAt)} 졸업
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}
