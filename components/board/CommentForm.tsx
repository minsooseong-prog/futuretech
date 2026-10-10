'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createComment } from '@/lib/actions/board';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function CommentForm({ postId }: { postId: number }) {
  const [state, formAction] = useActionState(createComment.bind(null, postId), undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="space-y-2">
      <label htmlFor="comment" className="sr-only">댓글 작성</label>
      <textarea id="comment" name="content" required maxLength={1000} rows={3} placeholder="댓글을 남겨보세요" className="textarea min-h-[5rem]" />
      <FormMessage error={state?.error} />
      <div className="flex justify-end">
        <SubmitButton className="btn-sm h-9">댓글 등록</SubmitButton>
      </div>
    </form>
  );
}
