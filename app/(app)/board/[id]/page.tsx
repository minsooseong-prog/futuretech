import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ArrowLeft, Eye } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { CommentSection, type CommentNode } from '@/components/board/comments';
import { PostActions } from '@/components/board/post-actions';
import { ViewTracker } from '@/components/board/view-tracker';
import { db } from '@/lib/db';
import { boardImages, boardPosts, comments, postLikes, users } from '@/lib/db/schema';
import { requireUser, canManage } from '@/lib/auth/guard';
import { formatDateTime } from '@/lib/utils/date';
import { formatClassInfo } from '@/lib/utils/student-id';
import { mediaUrl } from '@/lib/media';
import { excerpt } from '@/lib/utils/text';

export const dynamic = 'force-dynamic';

async function loadPost(id: string) {
  const rows = await db
    .select({
      id: boardPosts.id,
      category: boardPosts.category,
      title: boardPosts.title,
      content: boardPosts.content,
      views: boardPosts.views,
      likes: boardPosts.likes,
      createdAt: boardPosts.createdAt,
      updatedAt: boardPosts.updatedAt,
      authorId: users.id,
      authorName: users.name,
      authorAvatar: users.avatarPath,
      authorGrade: users.grade,
      authorClass: users.classNumber,
      authorNumber: users.studentNumber,
    })
    .from(boardPosts)
    .innerJoin(users, eq(users.id, boardPosts.authorId))
    .where(eq(boardPosts.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await loadPost(id).catch(() => null);
  if (!post) return { title: '게시판 · Future Tech' };
  return { title: `${post.title} · Future Tech`, description: excerpt(post.content, 80) };
}

export default async function BoardPostPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const post = await loadPost(id);
  if (!post) notFound();

  const [images, commentRows, myLike] = await Promise.all([
    db
      .select({ storagePath: boardImages.storagePath })
      .from(boardImages)
      .where(eq(boardImages.postId, id))
      .orderBy(asc(boardImages.sortOrder)),
    db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        parentId: comments.parentId,
        authorId: users.id,
        authorName: users.name,
        authorAvatar: users.avatarPath,
      })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorId))
      .where(eq(comments.postId, id))
      .orderBy(asc(comments.createdAt)),
    db
      .select({ userId: postLikes.userId })
      .from(postLikes)
      .where(eq(postLikes.postId, id)),
  ]);

  const commentNodes: CommentNode[] = commentRows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    parentId: row.parentId,
    authorId: row.authorId,
    authorName: row.authorName,
    authorAvatar: row.authorAvatar,
    canDelete: canManage(user, row.authorId),
  }));

  const authorDetail = formatClassInfo(post.authorGrade, post.authorClass, post.authorNumber);
  const edited = post.updatedAt.getTime() - post.createdAt.getTime() > 60_000;

  return (
    <div className="mx-auto max-w-3xl">
      <ViewTracker postId={post.id} />

      <Link
        href="/board"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-subtle transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        게시판
      </Link>

      <Card>
        <CardBody className="sm:p-7">
          <article>
            <header>
              <div className="flex items-center gap-2">
                <Badge>{post.category}</Badge>
                {edited && <span className="text-[11px] text-faint">수정됨</span>}
              </div>

              <h1 className="mt-2.5 text-[24px] font-semibold leading-snug tracking-tight text-balance">
                {post.title}
              </h1>

              <div className="mt-4 flex items-center gap-3 border-b border-line pb-5">
                <Avatar name={post.authorName} path={post.authorAvatar} size="md" />
                <div className="min-w-0">
                  <Link href={`/profile/${post.authorId}`} className="text-sm font-medium hover:underline">
                    {post.authorName}
                  </Link>
                  <p className="mt-0.5 text-[12px] text-faint">
                    {authorDetail && `${authorDetail} · `}
                    {formatDateTime(post.createdAt)}
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-1 text-[12px] tabular-nums text-faint">
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  {post.views}
                </span>
              </div>
            </header>

            {/* Rendered as plain text — user input is never interpreted as HTML. */}
            <div className="mt-6 whitespace-pre-wrap break-words text-[15px] leading-[1.75]">
              {post.content}
            </div>

            {images.length > 0 && (
              <div className="mt-6 space-y-3">
                {images.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={image.storagePath}
                    src={mediaUrl(image.storagePath) ?? ''}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-xl border border-line"
                  />
                ))}
              </div>
            )}
          </article>

          <PostActions
            postId={post.id}
            likes={post.likes}
            liked={myLike.some((l) => l.userId === user.id)}
            canEdit={post.authorId === user.id}
            canDelete={canManage(user, post.authorId)}
          />

          <CommentSection
            postId={post.id}
            comments={commentNodes}
            currentUser={{ name: user.name, avatarPath: user.avatarPath }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
