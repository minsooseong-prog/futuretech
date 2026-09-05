import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq, sql } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { db } from '@/lib/db';
import { albumImages, albumPosts, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guard';
import { formatDate } from '@/lib/utils/date';
import { thumbUrl } from '@/lib/media';
import { excerpt } from '@/lib/utils/text';

export const metadata: Metadata = { title: '앨범 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function AlbumPage() {
  await requireUser();

  const albums = await db
    .select({
      id: albumPosts.id,
      title: albumPosts.title,
      description: albumPosts.description,
      createdAt: albumPosts.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorAvatar: users.avatarPath,
      photoCount: sql<number>`(select count(*) from ${albumImages} where ${albumImages.albumPostId} = ${albumPosts.id})`,
      coverPath: sql<string | null>`(select ${albumImages.storagePath} from ${albumImages}
        where ${albumImages.albumPostId} = ${albumPosts.id}
        order by ${albumImages.sortOrder} asc limit 1)`,
      coverThumb: sql<string | null>`(select ${albumImages.thumbPath} from ${albumImages}
        where ${albumImages.albumPostId} = ${albumPosts.id}
        order by ${albumImages.sortOrder} asc limit 1)`,
    })
    .from(albumPosts)
    .innerJoin(users, eq(users.id, albumPosts.authorId))
    .orderBy(desc(albumPosts.createdAt))
    .limit(60);

  return (
    <>
      <PageHeader
        title="앨범"
        description="미래공학 수업과 우리 반의 순간들."
        action={
          <Link
            href="/album/new"
            className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-canvas transition hover:opacity-90"
          >
            사진 올리기
          </Link>
        }
      />

      {albums.length === 0 ? (
        <EmptyState
          title="아직 등록된 사진이 없습니다."
          description="우리 반의 첫 번째 추억을 남겨보세요."
          action={
            <Link
              href="/album/new"
              className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-canvas transition hover:opacity-90"
            >
              사진 올리기
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {albums.map((album) => (
            <li key={album.id}>
              <Link
                href={`/album/${album.id}`}
                className="group block overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:shadow-pop"
              >
                <div className="aspect-[4/3] overflow-hidden bg-canvas">
                  {album.coverPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbUrl(album.coverThumb, album.coverPath) ?? ''}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[13px] text-faint">
                      사진 없음
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h2 className="truncate text-[15px] font-semibold tracking-tight">{album.title}</h2>
                  {album.description && (
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-subtle">
                      {excerpt(album.description, 90)}
                    </p>
                  )}
                  <div className="mt-3.5 flex items-center gap-2">
                    <Avatar name={album.authorName} path={album.authorAvatar} size="xs" />
                    <span className="text-[12px] text-subtle">{album.authorName}</span>
                    <span className="ml-auto text-[12px] tabular-nums text-faint">
                      {formatDate(album.createdAt)} · {Number(album.photoCount)}장
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
