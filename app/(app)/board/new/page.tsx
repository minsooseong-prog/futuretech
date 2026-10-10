import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { createBoardPost } from '@/lib/actions/board';
import { BoardForm } from '@/components/board/BoardForm';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '글쓰기' };

export default async function NewBoardPostPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="글쓰기" />
      <BoardForm action={createBoardPost} submitLabel="등록하기" />
    </div>
  );
}
