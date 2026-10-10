import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { Megaphone, PenLine, Pin } from 'lucide-react';
import { db } from '@/lib/db';
import { notices, users } from '@/lib/db/schema';
import { formatDate, formatRelative } from '@/lib/utils/date';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '공지사항' };

export default async function NoticesPage() {
  const rows = await db
    .select({ id: notices.id, title: notices.title, pinned: notices.pinned, createdAt: notices.createdAt, author: users.name })
    .from(notices)
    .leftJoin(users, eq(notices.authorId, users.id))
    .orderBy(desc(notices.pinned), desc(notices.createdAt))
    .limit(100);

  const writeButton = (
    <Link href="/notices/new" className="btn-primary">
      <PenLine className="h-4 w-4" aria-hidden="true" />
      공지 작성
    </Link>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="공지사항" description="수업과 반 운영에 관한 안내입니다." action={writeButton} />
      {rows.length === 0 ? (
        <EmptyState icon={Megaphone} title="아직 공지가 없습니다." description="새 공지가 올라오면 이곳과 홈 화면에 표시됩니다." />
      ) : (
        <ul className="card divide-y divide-line">
          {rows.map((n) => (
            <li key={n.id}>
              <Link href={`/notices/${n.id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-subtle/50">
                {n.pinned ? (
                  <Pin className="h-4 w-4 shrink-0" aria-label="고정 공지" />
                ) : (
                  <span className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span className={n.pinned ? 'min-w-0 flex-1 truncate font-semibold' : 'min-w-0 flex-1 truncate'}>{n.title}</span>
                <span className="hidden shrink-0 text-xs text-muted sm:inline">{n.author ?? '졸업생'}</span>
                <time className="shrink-0 text-xs tabular-nums text-muted" dateTime={n.createdAt.toISOString()} title={formatDate(n.createdAt)}>
                  {formatRelative(n.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
