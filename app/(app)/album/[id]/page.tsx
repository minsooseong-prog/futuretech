import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { ArrowLeft, Pencil } from 'lucide-react';
import { PhotoGrid } from '@/components/album/lightbox';
import { AlbumDeleteButton } from '@/components/album/album-delete-button';
import { Avatar } from '@/components/ui/avatar';
import { db } from '@/lib/db';
import { albumImages, albumPosts, users } from '@/lib/db/schema';
import { canManage, requireUser } from '@/lib/auth/guard';
import { formatDateTime } from '@/lib/utils/date';
import { formatClassInfo } from '@/lib/utils/student-id';

export const dynamic = 'force-dynamic';

async function loadAlbum(id: string) {
  const rows = await db
    .select({
      id: albumPosts.id,
      title: albumPosts.title,
      description: albumPosts.description,
      createdAt: albumPosts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorAvatar: users.avatarPath,
      authorGrade: users.grade,
      authorClass: users.classNumber,
      authorNumber: users.studentNumber,
    })
    .from(albumPosts)
    .innerJoin(users, eq(users.id, albumPosts.authorId))
    .where(eq(albumPosts.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const album = await loadAlbum(id).catch(() => null);
  return { title: album ? `${album.title} · Future Tech` : '앨범 · Future Tech' };
}

export default async function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const album = await loadAlbum(id);
  if (!album) notFound();

  const images = await db
    .select({ storagePath: albumImages.storagePath, thumbPath: albumImages.thumbPath })
    .from(albumImages)
    .where(eq(albumImages.albumPostId, id))
    .orderBy(asc(albumImages.sortOrder));

  const manageable = canManage(user, album.authorId);
  const authorDetail = formatClassInfo(album.authorGrade, album.authorClass, album.authorNumber);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/album"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-subtle transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        앨범
      </Link>

      <header className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight text-balance">{album.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Avatar name={album.authorName} path={album.authorAvatar} size="md" />
          <div>
            <Link href={`/profile/${album.authorId}`} className="text-sm font-medium hover:underline">
              {album.authorName}
            </Link>
            <p className="mt-0.5 text-[12px] text-faint">
              {authorDetail && `${authorDetail} · `}
              {formatDateTime(album.createdAt)} · 사진 {images.length}장
            </p>
          </div>

          {manageable && (
            <div className="ml-auto flex items-center gap-2">
              {album.authorId === user.id && (
                <Link
                  href={`/album/${album.id}/edit`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] text-subtle transition hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  수정
                </Link>
              )}
              <AlbumDeleteButton albumId={album.id} />
            </div>
          )}
        </div>

        {album.description && (
          <p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-[1.75] text-subtle">
            {album.description}
          </p>
        )}
      </header>

      <PhotoGrid images={images} title={album.title} />
    </div>
  );
}
