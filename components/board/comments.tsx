'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { useToast } from '@/components/ui/toast';
import { createComment, deleteComment } from '@/actions/board';
import { formatRelative } from '@/lib/utils/date';
import type { ActionResult } from '@/lib/utils/errors';

export type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  canDelete: boolean;
};

export function CommentSection({
  postId,
  comments,
  currentUser,
}: {
  postId: string;
  comments: CommentNode[];
  currentUser: { name: string; avatarPath: string | null };
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  async function remove(commentId: string) {
    const result = await deleteComment(commentId);
    notify(result.ok ? (result.message ?? '삭제했습니다.') : result.error, result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  return (
    <section aria-label="댓글" className="mt-8">
      <h2 className="mb-4 text-[15px] font-semibold">댓글 {comments.length}</h2>

      <CommentForm postId={postId} currentUser={currentUser} onDone={() => router.refresh()} />

      {comments.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-subtle">
          첫 댓글을 남겨 보세요.
        </p>
      ) : (
        <ul className="mt-6 space-y-5">
          {roots.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                onDelete={remove}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              />

              {replyTo === comment.id && (
                <div className="ml-11 mt-3">
                  <CommentForm
                    postId={postId}
                    parentId={comment.id}
                    currentUser={currentUser}
                    compact
                    onDone={() => {
                      setReplyTo(null);
                      router.refresh();
                    }}
                  />
                </div>
              )}

              {repliesOf(comment.id).length > 0 && (
                <ul className="ml-11 mt-4 space-y-4 border-l border-line pl-4">
                  {repliesOf(comment.id).map((reply) => (
                    <li key={reply.id}>
                      <CommentItem comment={reply} onDelete={remove} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  onDelete,
  onReply,
}: {
  comment: CommentNode;
  onDelete: (id: string) => void;
  onReply?: () => void;
}) {
  return (
    <article className="flex gap-3">
      <Avatar name={comment.authorName} path={comment.authorAvatar} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium">{comment.authorName}</span>
          <time className="text-[11px] text-faint">{formatRelative(comment.createdAt)}</time>
          <div className="ml-auto flex items-center gap-1">
            {onReply && (
              <button
                type="button"
                onClick={onReply}
                className="rounded-md px-1.5 py-0.5 text-[11px] text-faint transition hover:text-ink"
              >
                답글
              </button>
            )}
            {comment.canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                aria-label="댓글 삭제"
                className="rounded-md p-1 text-faint transition hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{comment.content}</p>
      </div>
    </article>
  );
}

function CommentForm({
  postId,
  parentId,
  currentUser,
  compact = false,
  onDone,
}: {
  postId: string;
  parentId?: string;
  currentUser: { name: string; avatarPath: string | null };
  compact?: boolean;
  onDone: () => void;
}) {
  const { notify } = useToast();

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await createComment(prev, formData);
      if (result.ok) {
        notify(result.message ?? '댓글을 남겼습니다.');
        onDone();
      }
      return result;
    },
    null as ActionResult | null,
  );

  return (
    <form action={formAction} className="flex gap-3" noValidate>
      {!compact && <Avatar name={currentUser.name} path={currentUser.avatarPath} size="sm" />}
      <div className="flex-1 space-y-2">
        <input type="hidden" name="postId" value={postId} />
        {parentId && <input type="hidden" name="parentId" value={parentId} />}
        <Textarea
          name="content"
          required
          rows={compact ? 2 : 3}
          maxLength={1000}
          placeholder={parentId ? '답글을 입력하세요.' : '댓글을 입력하세요.'}
          className="min-h-[72px]"
          aria-label={parentId ? '답글 입력' : '댓글 입력'}
        />
        {state && !state.ok && <FormMessage error={state.error} />}
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={pending}>
            {parentId ? '답글 남기기' : '댓글 남기기'}
          </Button>
        </div>
      </div>
    </form>
  );
}
