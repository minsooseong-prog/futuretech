'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Pencil, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { useToast } from '@/components/ui/toast';
import { deleteBoardPost, toggleLike } from '@/actions/board';

export function PostActions({
  postId,
  likes,
  liked,
  canEdit,
  canDelete,
}: {
  postId: string;
  likes: number;
  liked: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [optimistic, setOptimistic] = useState({ likes, liked });
  const [pending, startTransition] = useTransition();

  function like() {
    startTransition(async () => {
      const result = await toggleLike(postId);
      if (!result.ok) {
        notify(result.error, 'error');
        return;
      }
      const isLiked = result.data?.liked ?? false;
      setOptimistic((prev) => ({ liked: isLiked, likes: prev.likes + (isLiked ? 1 : -1) }));
    });
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-5">
      <Button
        type="button"
        variant={optimistic.liked ? 'primary' : 'secondary'}
        size="sm"
        onClick={like}
        loading={pending}
        aria-pressed={optimistic.liked}
      >
        <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
        추천 {optimistic.likes}
      </Button>

      <div className="ml-auto flex items-center gap-2">
        {canEdit && (
          <Link
            href={`/board/${postId}/edit`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] text-subtle transition hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            수정
          </Link>
        )}
        {canDelete && (
          <ConfirmButton
            variant="ghost"
            size="sm"
            title="글을 삭제할까요?"
            description="글과 댓글, 첨부한 사진이 함께 지워집니다. 되돌릴 수 없습니다."
            action={() => deleteBoardPost(postId)}
            onDone={() => {
              router.push('/board');
              router.refresh();
            }}
          >
            삭제
          </ConfirmButton>
        )}
      </div>
    </div>
  );
}
