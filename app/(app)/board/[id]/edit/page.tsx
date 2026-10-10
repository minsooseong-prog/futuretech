import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { boardImages, boardPosts } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { signImagePaths } from '@/lib/supabase/server';
import { updateBoardPost } from '@/lib/actions/board';
import { BoardForm } from '@/components/board/BoardForm';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '글 수정' };

export default async function EditBoardPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const raw = (await params).id;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const id = Number(raw);

  const [post] = await db.select().from(boardPosts).where(eq(boardPosts.id, id)).limit(1);
  if (!post) notFound();
  if (post.authorId !== user.id) redirect(`/board/${id}`);

  const images = await db
    .select({ id: boardImages.id, storagePath: boardImages.storagePath })
    .from(boardImages)
    .where(eq(boardImages.postId, id))
    .orderBy(asc(boardImages.sortOrder));
  const urlOf = await signImagePaths(images.map((i) => i.storagePath));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="글 수정" />
      <BoardForm
        action={updateBoardPost.bind(null, id)}
        initial={{ category: post.category, title: post.title, content: post.content }}
        existingImages={images.map((i) => ({ id: i.id, url: urlOf(i.storagePath).thumb }))}
        submitLabel="수정 완료"
      />
    </div>
  );
}
