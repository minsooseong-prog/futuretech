'use client';

import { useState, useTransition } from 'react';
import { ThumbsUp } from 'lucide-react';
import { toggleLike } from '@/lib/actions/board';
import { cn } from '@/lib/utils/cn';

export function LikeButton({ postId, liked: initialLiked, likes: initialLikes }: { postId: number; liked: boolean; likes: number }) {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={liked}
      onClick={() =>
        start(async () => {
          const res = await toggleLike(postId);
          if (!('error' in res)) {
            setLiked(res.liked);
            setLikes(res.likes);
          }
        })
      }
      className={cn('btn h-11 min-w-[7rem] border', liked ? 'border-ink bg-ink text-canvas' : 'border-line bg-card hover:bg-subtle')}
    >
      <ThumbsUp className="h-4 w-4" aria-hidden="true" />
      추천 {likes}
    </button>
  );
}
