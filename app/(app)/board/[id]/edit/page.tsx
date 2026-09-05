import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { PostForm } from '@/components/board/post-form';
import { Card, CardBody } from '@/components/ui/card';
import { updateBoardPost } from '@/actions/board';
import { db } from '@/lib/db';
import { boardPosts } from '@/lib/db/schema';
import { canManage, requireUser } from '@/lib/auth/guard';

export const metadata: Metadata = { title: '글 수정 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function EditBoardPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const rows = await db.select().from(boardPosts).where(eq(boardPosts.id, id)).limit(1);
  const post = rows[0];
  if (!post) notFound();

  // Authorization is checked here and again inside the action.
  if (!canManage(user, post.authorId)) redirect(`/board/${id}`);

  const action = updateBoardPost.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="글 수정" />
      <Card>
        <CardBody>
          <PostForm
            action={action}
            submitLabel="수정 저장"
            initial={{ category: post.category, title: post.title, content: post.content }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
