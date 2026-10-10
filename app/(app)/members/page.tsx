import type { Metadata } from 'next';
import Link from 'next/link';
import { asc, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { alumni, users } from '@/lib/db/schema';
import { signUrls } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/date';
import { formatStudentInfo, isStaff } from '@/lib/utils/student';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '멤버' };

type Member = {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  grade: number | null;
  classNumber: number | null;
  studentNumber: number | null;
  avatarPath: string | null;
};

export default async function MembersPage() {
  const [members, graduates] = await Promise.all([
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
    db.select().from(alumni).orderBy(desc(alumni.graduatedAt)),
  ]);

  const urls = await signUrls(members.map((m) => m.avatarPath));

  const groups: { title: string; list: Member[] }[] = [
    { title: '1학년', list: members.filter((m) => m.role === 'student' && m.grade === 1) },
    { title: '2학년', list: members.filter((m) => m.role === 'student' && m.grade === 2) },
    { title: '3학년', list: members.filter((m) => m.role === 'student' && m.grade === 3) },
    { title: '교사', list: members.filter((m) => isStaff(m.role)) },
  ];

  return (
    <div>
      <PageHeader title="멤버" description={`현재 ${members.length}명이 함께하고 있습니다.`} />
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`grp-${g.title}`}>
            <h2 id={`grp-${g.title}`} className="mb-3 flex items-baseline gap-2 border-b border-line pb-2">
              <span className="section-title">{g.title}</span>
              <span className="text-xs tabular-nums text-muted">{g.list.length}</span>
            </h2>
            {g.list.length === 0 ? (
              <p className="py-3 text-sm text-muted">아직 등록된 멤버가 없습니다.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.list.map((m) => (
                  <li key={m.id}>
                    <Link href={`/profile/${m.id}`} className="card flex items-center gap-3 p-3 transition-colors hover:border-ink/25">
                      <Avatar src={m.avatarPath ? urls[m.avatarPath] : null} name={m.name} size={40} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{m.name}</span>
                        <span className="block text-xs text-muted">{formatStudentInfo(m)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section aria-labelledby="grp-alumni">
          <h2 id="grp-alumni" className="mb-3 flex items-baseline gap-2 border-b border-line pb-2">
            <span className="section-title">졸업생</span>
            <span className="text-xs tabular-nums text-muted">{graduates.length}</span>
          </h2>
          {graduates.length === 0 ? (
            <p className="py-3 text-sm text-muted">아직 졸업생이 없습니다.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {graduates.map((a) => (
                <li key={a.id} className="inline-flex items-baseline gap-2 rounded-lg border border-line px-3 py-2">
                  <span className="text-sm">{a.name}</span>
                  <span className="text-xs text-muted">{formatDate(a.graduatedAt)} 졸업</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
