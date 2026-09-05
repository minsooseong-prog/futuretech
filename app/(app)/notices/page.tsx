import type { Metadata } from 'next';
import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { Pin } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guard';
import { formatDate } from '@/lib/utils/date';
import { excerpt } from '@/lib/utils/text';

export const metadata: Metadata = { title: '공지사항 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function NoticesPage() {
  await requireUser();

  const rows = await db
    .select()
    .from(notices)
    .orderBy(desc(notices.pinned), desc(notices.createdAt))
    .limit(60);

  return (
    <>
      <PageHeader
        title="공지사항"
        description="누구나 읽을 수 있고, 작성에는 선생님 비밀번호가 필요합니다."
        action={
          <Link
            href="/notices/new"
            className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-canvas transition hover:opacity-90"
          >
            공지 작성
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="등록된 공지가 없습니다."
          description="수업 안내나 준비물 공지를 올려 보세요."
        />
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {rows.map((notice) => (
            <li key={notice.id}>
              <Link href={`/notices/${notice.id}`} className="block px-5 py-4 transition hover:bg-canvas">
                <div className="flex items-start gap-2">
                  {notice.pinned && (
                    <Pin className="mt-1 h-3.5 w-3.5 shrink-0 text-ink" aria-label="고정된 공지" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-medium">{notice.title}</h2>
                    <p className="mt-1 line-clamp-1 text-[13px] text-subtle">
                      {excerpt(notice.content, 110)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] tabular-nums text-faint">
                    {formatDate(notice.createdAt)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
