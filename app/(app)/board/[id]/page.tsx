import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { and, asc, count, eq, sql } from 'drizzle-orm';
import { ArrowLeft, Eye, PenLine, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { boardImages, boardLikes, boardPosts, comments, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { signImagePaths, signUrls } from '@/lib/supabase/server';
import { deleteBoardPost, deleteComment } from '@/lib/actions/board';
import { categoryLabel } from '@/lib/constants';
import { formatDateTime, formatRelative } from '@/lib/utils/date';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmAction } from '@/components/ui/ConfirmAction';
import { Gallery } from '@/components/album/Gallery';
import { LikeButton } from '@/components/board/LikeButton';
import { CommentForm } from '@/components/board/CommentForm';

type Params = Promise<{ id: string }>;

const parseId = (raw: string) => (/^\d{1,9}$/.test(raw) ? Number(raw) : null);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id) return { title: '게시판' };
  const [p] = await db.select({ title: boardPosts.title }).from(boardPosts).where(eq(boardPosts.id, id)).limit(1);
  return { title: p?.title ?? '게시판' };
}

export default async function BoardPostPage({ params }: { params: Params }) {
  const user = await requireUser();
  const id = parseId((await params).id);
  if (!id) notFound();

  const [post] = await db
    .select({
      id: boardPosts.id,
      title: boardPosts.title,
      content: boardPosts.content,
      category: boardPosts.category,
      views: boardPosts.views,
      createdAt: boardPosts.createdAt,
      updatedAt: boardPosts.updatedAt,
      authorId: boardPosts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarPath,
    })
    .from(boardPosts)
    .leftJoin(users, eq(boardPosts.authorId, users.id))
    .where(eq(boardPosts.id, id))
    .limit(1);
  if (!post) notFound();

  // 응답을 보낸 뒤 조회수를 올립니다.
  after(async () => {
    await db.update(boardPosts).set({ views: sql`${boardPosts.views} + 1` }).where(eq(boardPosts.id, id));
  });

  const [images, commentRows, [{ likes }], mine] = await Promise.all([
    db.select({ id: boardImages.id, storagePath: boardImages.storagePath }).from(boardImages).where(eq(boardImages.postId, id)).orderBy(asc(boardImages.sortOrder)),
    db
      .select({ id: comments.id, content: comments.content, createdAt: comments.createdAt, authorId: comments.authorId, authorName: users.name, authorAvatar: users.avatarPath })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, id))
      .orderBy(asc(comments.createdAt)),
    db.select({ likes: count() }).from(boardLikes).where(eq(boardLikes.postId, id)),
    db.select({ postId: boardLikes.postId }).from(boardLikes).where(and(eq(boardLikes.postId, id), eq(boardLikes.userId, user.id))).limit(1),
  ]);

  const [imageUrl, avatarUrls] = await Promise.all([
    signImagePaths(images.map((i) => i.storagePath)),
    signUrls([post.authorAvatar, ...commentRows.map((c) => c.authorAvatar)]),
  ]);

  const isAuthor = post.authorId === user.id;
  const canDelete = isAuthor || user.role === 'admin';
  const edited = post.updatedAt.getTime() - post.createdAt.getTime() > 60_000;

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/board" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        목록
      </Link>

      <div className="card p-5 md:p-7">
        <header className="border-b border-line pb-5">
          <span className="chip">{categoryLabel(post.category)}</span>
          <h1 className="mt-3 text-[1.4rem] font-semibold leading-snug tracking-[-0.02em]">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {post.authorId ? (
              <Link href={`/profile/${post.authorId}`} className="flex items-center gap-2 text-sm font-medium hover:underline">
                <Avatar src={post.authorAvatar ? avatarUrls[post.authorAvatar] : null} name={post.authorName ?? '?'} size={28} />
                {post.authorName}
              </Link>
            ) : (
              <span className="flex items-center gap-2 text-sm text-muted">
                <Avatar name="졸" size={28} />
                졸업생
              </span>
            )}
            <span className="text-xs text-muted">
              {formatDateTime(post.createdAt)}
              {edited && ' (수정됨)'}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {post.views + 1}
            </span>
          </div>
        </header>

        <div className="prose-plain py-6">{post.content}</div>

        {images.length > 0 && (
          <div className="pb-6">
            <Gallery
              layout="grid"
              alt={post.title}
              images={images.map((img) => ({ id: img.id, ...imageUrl(img.storagePath) }))}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <LikeButton postId={post.id} likes={likes} liked={mine.length > 0} />
          <div className="flex gap-1">
            {isAuthor && (
              <Link href={`/board/${post.id}/edit`} className="btn-ghost btn-sm">
                <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                수정
              </Link>
            )}
            {canDelete && (
              <ConfirmAction
                action={deleteBoardPost.bind(null, post.id)}
                label={
                  <>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    삭제
                  </>
                }
                title="게시글을 삭제할까요?"
                description="첨부 사진과 댓글도 함께 삭제되며 되돌릴 수 없습니다."
              />
            )}
          </div>
        </div>
      </div>

      <section className="card mt-4 p-5 md:p-7" aria-labelledby="comments-title">
        <h2 id="comments-title" className="section-title mb-4">
          댓글 {commentRows.length}
        </h2>
        {commentRows.length > 0 && (
          <ul className="mb-5 divide-y divide-line">
            {commentRows.map((c) => (
              <li key={c.id} className="flex gap-3 py-3.5">
                <Avatar src={c.authorAvatar ? avatarUrls[c.authorAvatar] : null} name={c.authorName ?? '졸'} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {c.authorId ? (
                      <Link href={`/profile/${c.authorId}`} className="text-sm font-medium hover:underline">
                        {c.authorName}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">졸업생</span>
                    )}
                    <span className="text-xs text-muted">{formatRelative(c.createdAt)}</span>
                    {(c.authorId === user.id || user.role === 'admin') && (
                      <span className="ml-auto">
                        <ConfirmAction
                          action={deleteComment.bind(null, c.id)}
                          label={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                          ariaLabel="댓글 삭제"
                          className="h-7 px-2"
                          title="댓글을 삭제할까요?"
                        />
                      </span>
                    )}
                  </div>
                  <p className="prose-plain mt-1 text-sm">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <CommentForm postId={post.id} />
      </section>
    </article>
  );
}
