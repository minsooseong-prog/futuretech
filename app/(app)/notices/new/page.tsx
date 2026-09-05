import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { NoticeForm } from '@/components/board/notice-form';
import { Card, CardBody } from '@/components/ui/card';
import { createNotice } from '@/actions/notices';
import { isStaff, requireUser } from '@/lib/auth/guard';

export const metadata: Metadata = { title: '공지 작성 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function NewNoticePage() {
  const user = await requireUser();
  const staff = isStaff(user);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="공지 작성"
        description={
          staff
            ? '선생님 계정이라 비밀번호 없이 바로 올릴 수 있습니다.'
            : '공지를 올리려면 선생님 비밀번호가 필요합니다.'
        }
      />
      <Card>
        <CardBody>
          <NoticeForm action={createNotice} isStaff={staff} />
        </CardBody>
      </Card>
    </div>
  );
}
