import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft, Pin } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { NoticeAdminBar } from '@/components/board/notice-admin-bar';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';
import { isStaff, requireUser } from '@/lib/auth/guard';
import { formatDateTime } from '@/lib/utils/date';
import { excerpt } from '@/lib/utils/text';

export const dynamic = 'force-dynamic';

async function loadNotice(id: string) {
  const rows = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const notice = await loadNotice(id).catch(() => null);
  if (!notice) return { title: '공지사항 · Future Tech' };
  return { title: `${notice.title} · Future Tech`, description: excerpt(notice.content, 80) };
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const notice = await loadNotice(id);
  if (!notice) notFound();

  const canManageNotice = isStaff(user) || notice.authorId === user.id;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/notices"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-subtle transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        공지사항
      </Link>

      <Card>
        <CardBody className="sm:p-7">
          <article>
            {notice.pinned && (
              <p className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink">
                <Pin className="h-3 w-3" aria-hidden />
                고정된 공지
              </p>
            )}

            <h1 className="text-[24px] font-semibold leading-snug tracking-tight text-balance">
              {notice.title}
            </h1>
            <p className="mt-2 border-b border-line pb-5 text-[12px] text-faint">
              {notice.authorName} · {formatDateTime(notice.createdAt)}
            </p>

            <div className="mt-6 whitespace-pre-wrap break-words text-[15px] leading-[1.75]">
              {notice.content}
            </div>
          </article>

          {canManageNotice && (
            <NoticeAdminBar
              noticeId={notice.id}
              pinned={notice.pinned}
              isAdmin={user.role === 'admin'}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
