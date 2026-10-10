import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { albumImages, albumPosts } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { signImagePaths } from '@/lib/supabase/server';
import { updateAlbumPost } from '@/lib/actions/album';
import { isUuid } from '@/lib/storage-paths';
import { AlbumForm } from '@/components/album/AlbumForm';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '앨범 수정' };

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [post] = await db.select().from(albumPosts).where(eq(albumPosts.id, id)).limit(1);
  if (!post) notFound();
  if (post.authorId !== user.id) redirect(`/album/${id}`);

  const images = await db
    .select({ id: albumImages.id, storagePath: albumImages.storagePath })
    .from(albumImages)
    .where(eq(albumImages.albumPostId, id))
    .orderBy(asc(albumImages.sortOrder));
  const urlOf = await signImagePaths(images.map((i) => i.storagePath));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="앨범 수정" />
      <AlbumForm
        action={updateAlbumPost.bind(null, id)}
        initial={{ title: post.title, description: post.description }}
        existingImages={images.map((i) => ({ id: i.id, url: urlOf(i.storagePath).thumb }))}
        submitLabel="수정 완료"
      />
    </div>
  );
}
