import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ArrowLeft, PenLine, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { albumImages, albumPosts, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { signImagePaths, signUrls } from '@/lib/supabase/server';
import { deleteAlbumPost } from '@/lib/actions/album';
import { isUuid } from '@/lib/storage-paths';
import { formatDateTime } from '@/lib/utils/date';
import { formatStudentInfo } from '@/lib/utils/student';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmAction } from '@/components/ui/ConfirmAction';
import { Gallery } from '@/components/album/Gallery';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: '앨범' };
  const [p] = await db.select({ title: albumPosts.title }).from(albumPosts).where(eq(albumPosts.id, id)).limit(1);
  return { title: p?.title ?? '앨범' };
}

export default async function AlbumDetailPage({ params }: { params: Params }) {
  const user = await requireUser();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [post] = await db
    .select({
      id: albumPosts.id,
      title: albumPosts.title,
      description: albumPosts.description,
      createdAt: albumPosts.createdAt,
      authorId: albumPosts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarPath,
      authorRole: users.role,
      grade: users.grade,
      classNumber: users.classNumber,
      studentNumber: users.studentNumber,
    })
    .from(albumPosts)
    .leftJoin(users, eq(albumPosts.authorId, users.id))
    .where(eq(albumPosts.id, id))
    .limit(1);
  if (!post) notFound();

  const images = await db
    .select({ id: albumImages.id, storagePath: albumImages.storagePath })
    .from(albumImages)
    .where(eq(albumImages.albumPostId, id))
    .orderBy(asc(albumImages.sortOrder));

  const [imageUrl, avatarUrls] = await Promise.all([signImagePaths(images.map((i) => i.storagePath)), signUrls([post.authorAvatar])]);

  const isAuthor = post.authorId === user.id;
  const canDelete = isAuthor || user.role === 'admin';

  return (
    <article className="mx-auto max-w-4xl">
      <Link href="/album" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        앨범
      </Link>

      <header className="mb-6">
        <h1 className="page-title">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {post.authorId && post.authorRole ? (
            <Link href={`/profile/${post.authorId}`} className="flex items-center gap-2.5">
              <Avatar src={post.authorAvatar ? avatarUrls[post.authorAvatar] : null} name={post.authorName ?? '?'} size={36} />
              <span>
                <span className="block text-sm font-medium hover:underline">{post.authorName}</span>
                <span className="block text-xs text-muted">
                  {formatStudentInfo({ role: post.authorRole, grade: post.grade, classNumber: post.classNumber, studentNumber: post.studentNumber })}
                </span>
              </span>
            </Link>
          ) : (
            <span className="text-sm text-muted">졸업생</span>
          )}
          <time className="text-xs text-muted" dateTime={post.createdAt.toISOString()}>
            {formatDateTime(post.createdAt)}
          </time>
          <div className="ml-auto flex gap-1">
            {isAuthor && (
              <Link href={`/album/${post.id}/edit`} className="btn-ghost btn-sm">
                <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
                수정
              </Link>
            )}
            {canDelete && (
              <ConfirmAction
                action={deleteAlbumPost.bind(null, post.id)}
                label={
                  <>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    삭제
                  </>
                }
                title="앨범을 삭제할까요?"
                description={`사진 ${images.length}장이 모두 삭제되며 되돌릴 수 없습니다.`}
              />
            )}
          </div>
        </div>
        {post.description && <p className="prose-plain mt-5 max-w-2xl text-muted">{post.description}</p>}
      </header>

      <Gallery alt={post.title} images={images.map((img) => ({ id: img.id, ...imageUrl(img.storagePath) }))} />
    </article>
  );
}
