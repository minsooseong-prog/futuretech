import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { AlbumForm } from '@/components/album/album-form';
import { Card, CardBody } from '@/components/ui/card';
import { createAlbumPost } from '@/actions/album';
import { requireUser } from '@/lib/auth/guard';

export const metadata: Metadata = { title: '사진 올리기 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function NewAlbumPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="사진 올리기" description="한 번에 10장까지 올릴 수 있습니다." />
      <Card>
        <CardBody>
          <AlbumForm action={createAlbumPost} />
        </CardBody>
      </Card>
    </div>
  );
}
