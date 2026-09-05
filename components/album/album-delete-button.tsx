'use client';

import { useRouter } from 'next/navigation';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { deleteAlbumPost } from '@/actions/album';

export function AlbumDeleteButton({ albumId }: { albumId: string }) {
  const router = useRouter();

  return (
    <ConfirmButton
      variant="ghost"
      size="sm"
      title="앨범을 삭제할까요?"
      description="앨범에 올린 사진이 모두 지워집니다. 되돌릴 수 없습니다."
      action={() => deleteAlbumPost(albumId)}
      onDone={() => {
        router.push('/album');
        router.refresh();
      }}
    >
      삭제
    </ConfirmButton>
  );
}
