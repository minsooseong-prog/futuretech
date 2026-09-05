import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { AlbumForm } from '@/components/album/album-form';
import { Card, CardBody } from '@/components/ui/card';
import { updateAlbumPost } from '@/actions/album';
import { db } from '@/lib/db';
import { albumPosts } from '@/lib/db/schema';
import { canManage, requireUser } from '@/lib/auth/guard';

export const metadata: Metadata = { title: '앨범 수정 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const rows = await db.select().from(albumPosts).where(eq(albumPosts.id, id)).limit(1);
  const album = rows[0];
  if (!album) notFound();
  if (!canManage(user, album.authorId)) redirect(`/album/${id}`);

  const action = updateAlbumPost.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="앨범 수정" description="제목과 설명을 고칠 수 있습니다." />
      <Card>
        <CardBody>
          <AlbumForm
            action={action}
            submitLabel="수정 저장"
            withPhotos={false}
            initial={{ title: album.title, description: album.description ?? '' }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
