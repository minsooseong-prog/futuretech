import type { Metadata } from 'next';
import Link from 'next/link';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { ImagePlus, Images, Layers } from 'lucide-react';
import { db } from '@/lib/db';
import { albumImages, albumPosts, users } from '@/lib/db/schema';
import { signImagePaths, signUrls } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/utils/date';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '앨범' };

export default async function AlbumPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Math.min(500, Number((await searchParams).page) || 1));
  const size = 24;

  const posts = await db
    .select({
      id: albumPosts.id,
      title: albumPosts.title,
      createdAt: albumPosts.createdAt,
      authorId: albumPosts.authorId,
      authorName: users.name,
      authorAvatar: users.avatarPath,
      imageCount: sql<number>`(select count(*) from ${albumImages} where ${albumImages.albumPostId} = ${albumPosts.id})`.mapWith(Number),
    })
    .from(albumPosts)
    .leftJoin(users, eq(albumPosts.authorId, users.id))
    .orderBy(desc(albumPosts.createdAt))
    .limit(size + 1)
    .offset((page - 1) * size);

  const hasMore = posts.length > size;
  const visible = posts.slice(0, size);

  const covers = visible.length
    ? await db
        .select({ albumPostId: albumImages.albumPostId, storagePath: albumImages.storagePath })
        .from(albumImages)
        .where(inArray(albumImages.albumPostId, visible.map((p) => p.id)))
        .orderBy(asc(albumImages.sortOrder))
    : [];
  const coverOf = new Map<string, string>();
  for (const c of covers) if (!coverOf.has(c.albumPostId)) coverOf.set(c.albumPostId, c.storagePath);

  const [imageUrl, avatarUrls] = await Promise.all([
    signImagePaths([...coverOf.values()]),
    signUrls(visible.map((p) => p.authorAvatar)),
  ]);

  const newButton = (
    <Link href="/album/new" className="btn-primary">
      <ImagePlus className="h-4 w-4" aria-hidden="true" />
      사진 올리기
    </Link>
  );

  return (
    <div>
      <PageHeader title="앨범" description="Future Tech의 순간들을 모아둡니다." action={newButton} />

      {visible.length === 0 ? (
        <EmptyState icon={Images} title="아직 등록된 사진이 없습니다." description="우리 반의 첫 번째 추억을 남겨보세요." action={newButton} />
      ) : (
        <ul className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          {visible.map((p) => {
            const cover = coverOf.get(p.id);
            const src = cover ? imageUrl(cover).thumb : null;
            return (
              <li key={p.id} className="mb-4 break-inside-avoid">
                <Link href={`/album/${p.id}`} className="card group block overflow-hidden">
                  <div className="relative overflow-hidden bg-subtle">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={p.title} loading="lazy" decoding="async" className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]" />
                    ) : (
                      <div className="aspect-[4/3]" />
                    )}
                    {p.imageCount > 1 && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs text-white">
                        <Layers className="h-3 w-3" aria-hidden="true" />
                        {p.imageCount}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium">{p.title}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <Avatar src={p.authorAvatar ? avatarUrls[p.authorAvatar] : null} name={p.authorName ?? '졸'} size={20} />
                      <span>{p.authorName ?? '졸업생'}</span>
                      <span className="ml-auto">{formatDateTime(p.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(page > 1 || hasMore) && (
        <nav aria-label="페이지" className="mt-6 flex justify-center gap-2">
          {page > 1 && <Link href={`/album?page=${page - 1}`} className="btn-secondary">이전</Link>}
          {hasMore && <Link href={`/album?page=${page + 1}`} className="btn-secondary">다음</Link>}
        </nav>
      )}
    </div>
  );
}
