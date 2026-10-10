import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { ArrowLeft, PenLine, Pin, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { notices, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { deleteNotice } from '@/lib/actions/notices';
import { isUuid } from '@/lib/storage-paths';
import { formatDateTime } from '@/lib/utils/date';
import { ConfirmAction } from '@/components/ui/ConfirmAction';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: '공지사항' };
  const [n] = await db.select({ title: notices.title }).from(notices).where(eq(notices.id, id)).limit(1);
  return { title: n?.title ?? '공지사항' };
}

export default async function NoticeDetailPage({ params }: { params: Params }) {
  const user = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [notice] = await db
    .select({
      id: notices.id,
      title: notices.title,
      content: notices.content,
      pinned: notices.pinned,
      createdAt: notices.createdAt,
      updatedAt: notices.updatedAt,
      authorId: notices.authorId,
      authorName: users.name,
    })
    .from(notices)
    .leftJoin(users, eq(notices.authorId, users.id))
    .where(eq(notices.id, id))
    .limit(1);
  if (!notice) notFound();

  const canManage = notice.authorId === user.id || user.role === 'admin';
  const edited = notice.updatedAt.getTime() - notice.createdAt.getTime() > 60_000;

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/notices" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        공지사항
      </Link>
      <div className="card p-5 md:p-8">
        <header className="border-b border-line pb-5">
          {notice.pinned && (
            <span className="chip mb-3 gap-1 border-ink text-ink">
              <Pin className="h-3 w-3" aria-hidden="true" />
              고정
            </span>
          )}
          <h1 className="text-[1.4rem] font-semibold leading-snug tracking-[-0.02em]">{notice.title}</h1>
          <p className="mt-3 text-xs text-muted">
            {notice.authorName ?? '졸업생'} <span className="mx-1.5 text-line">|</span> {formatDateTime(notice.createdAt)}
            {edited && ` (수정 ${formatDateTime(notice.updatedAt)})`}
          </p>
        </header>
        <div className="prose-plain pt-6">{notice.content}</div>
        {canManage && (
          <div className="mt-8 flex justify-end gap-1 border-t border-line pt-4">
            <Link href={`/notices/${notice.id}/edit`} className="btn-ghost btn-sm">
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
              수정
            </Link>
            <ConfirmAction
              action={deleteNotice.bind(null, notice.id)}
              label={
                <>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  삭제
                </>
              }
              title="공지를 삭제할까요?"
              description="삭제한 공지는 되돌릴 수 없습니다."
            />
          </div>
        )}
      </div>
    </article>
  );
}
