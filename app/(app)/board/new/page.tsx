import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PostForm } from '@/components/board/post-form';
import { Card, CardBody } from '@/components/ui/card';
import { createBoardPost } from '@/actions/board';
import { requireUser } from '@/lib/auth/guard';

export const metadata: Metadata = { title: '글쓰기 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function NewBoardPostPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="글쓰기" />
      <Card>
        <CardBody>
          <PostForm action={createBoardPost} />
        </CardBody>
      </Card>
    </div>
  );
}
