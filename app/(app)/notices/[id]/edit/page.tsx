import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { NoticeForm } from '@/components/board/notice-form';
import { Card, CardBody } from '@/components/ui/card';
import { updateNotice } from '@/actions/notices';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';
import { isStaff, requireUser } from '@/lib/auth/guard';

export const metadata: Metadata = { title: '공지 수정 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function EditNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const rows = await db.select().from(notices).where(eq(notices.id, id)).limit(1);
  const notice = rows[0];
  if (!notice) notFound();

  const staff = isStaff(user);
  if (!staff && notice.authorId !== user.id) redirect(`/notices/${id}`);

  const action = updateNotice.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="공지 수정"
        description={staff ? undefined : '수정할 때도 선생님 비밀번호가 필요합니다.'}
      />
      <Card>
        <CardBody>
          <NoticeForm
            action={action}
            isStaff={staff}
            submitLabel="수정 저장"
            initial={{ title: notice.title, content: notice.content, pinned: notice.pinned }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
