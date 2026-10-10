import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { createAlbumPost } from '@/lib/actions/album';
import { AlbumForm } from '@/components/album/AlbumForm';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '사진 올리기' };

export default async function NewAlbumPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="사진 올리기" description="한 번에 최대 10장까지 올릴 수 있습니다." />
      <AlbumForm action={createAlbumPost} submitLabel="앨범 등록" />
    </div>
  );
}
