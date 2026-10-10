import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { createNotice } from '@/lib/actions/notices';
import { isStaff } from '@/lib/utils/student';
import { NoticeForm } from '@/components/notices/NoticeForm';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '공지 작성' };

export default async function NewNoticePage() {
  const user = await requireUser();
  const staff = isStaff(user.role);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="공지 작성" />
      <NoticeForm action={createNotice} needsPassword={!staff} canPin={staff} submitLabel="공지 등록" />
    </div>
  );
}
