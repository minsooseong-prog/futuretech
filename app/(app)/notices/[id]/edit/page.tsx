import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { updateNotice } from '@/lib/actions/notices';
import { isUuid } from '@/lib/storage-paths';
import { isStaff } from '@/lib/utils/student';
import { NoticeForm } from '@/components/notices/NoticeForm';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '공지 수정' };

export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [notice] = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
  if (!notice) notFound();
  if (notice.authorId !== user.id && user.role !== 'admin') redirect(`/notices/${id}`);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="공지 수정" />
      <NoticeForm
        action={updateNotice.bind(null, id)}
        needsPassword={false}
        canPin={isStaff(user.role)}
        initial={{ title: notice.title, content: notice.content, pinned: notice.pinned }}
        submitLabel="수정 완료"
      />
    </div>
  );
}
