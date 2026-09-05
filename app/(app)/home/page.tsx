import type { Metadata } from 'next';
import Link from 'next/link';
import { asc, desc, eq, gte, sql } from 'drizzle-orm';
import { ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardHeader } from '@/components/ui/card';
import { db } from '@/lib/db';
import { albumImages, albumPosts, boardPosts, calendarEvents, notices, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guard';
import { formatDate, formatRelative, todayISO } from '@/lib/utils/date';
import { formatClassInfo, roleLabel } from '@/lib/utils/student-id';
import { thumbUrl } from '@/lib/media';

export const metadata: Metadata = { title: '홈 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await requireUser();
  const today = todayISO();

  const [recentNotices, recentPosts, recentAlbums, upcoming] = await Promise.all([
    db
      .select({ id: notices.id, title: notices.title, createdAt: notices.createdAt, pinned: notices.pinned })
      .from(notices)
      .orderBy(desc(notices.pinned), desc(notices.createdAt))
      .limit(4),

    db
      .select({
        id: boardPosts.id,
        title: boardPosts.title,
        category: boardPosts.category,
        createdAt: boardPosts.createdAt,
        authorName: users.name,
        authorAvatar: users.avatarPath,
      })
      .from(boardPosts)
      .innerJoin(users, eq(users.id, boardPosts.authorId))
      .orderBy(desc(boardPosts.createdAt))
      .limit(5),

    db
      .select({
        id: albumPosts.id,
        title: albumPosts.title,
        createdAt: albumPosts.createdAt,
        coverPath: sql<string | null>`(select ${albumImages.storagePath} from ${albumImages}
          where ${albumImages.albumPostId} = ${albumPosts.id}
          order by ${albumImages.sortOrder} asc limit 1)`,
        coverThumb: sql<string | null>`(select ${albumImages.thumbPath} from ${albumImages}
          where ${albumImages.albumPostId} = ${albumPosts.id}
          order by ${albumImages.sortOrder} asc limit 1)`,
      })
      .from(albumPosts)
      .orderBy(desc(albumPosts.createdAt))
      .limit(4),

    db
      .select()
      .from(calendarEvents)
      .where(gte(calendarEvents.endDate, today))
      .orderBy(asc(calendarEvents.startDate))
      .limit(4),
  ]);

  const detail =
    user.role === 'student'
      ? formatClassInfo(user.grade, user.classNumber, user.studentNumber)
      : roleLabel(user.role);

  return (
    <>
      <section className="mb-7">
        <div className="flex items-center gap-3.5">
          <Avatar name={user.name} path={user.avatarPath} size="lg" />
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">
              안녕하세요, {user.name}님.
            </h1>
            <p className="mt-0.5 text-sm text-subtle">{detail}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="공지사항" action={<MoreLink href="/notices" />} />
          {recentNotices.length === 0 ? (
            <Empty text="등록된 공지가 없습니다." />
          ) : (
            <ul className="divide-y divide-line">
              {recentNotices.map((notice) => (
                <li key={notice.id}>
                  <Link href={`/notices/${notice.id}`} className="flex items-center gap-2 px-5 py-3.5 transition hover:bg-canvas">
                    <span className="truncate text-[14px] font-medium">{notice.title}</span>
                    <span className="ml-auto shrink-0 text-[11px] tabular-nums text-faint">
                      {formatDate(notice.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="다가오는 일정" action={<MoreLink href="/calendar" />} />
          {upcoming.length === 0 ? (
            <Empty text="예정된 일정이 없습니다." />
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((event) => (
                <li key={event.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-16 shrink-0 text-[12px] tabular-nums text-faint">
                    {event.startDate.slice(5).replace('-', '.')}
                  </span>
                  <span className="truncate text-[14px] font-medium">{event.title}</span>
                  {!event.allDay && event.startTime && (
                    <span className="ml-auto shrink-0 text-[11px] tabular-nums text-faint">
                      {event.startTime}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="최근 게시글" action={<MoreLink href="/board" />} />
          {recentPosts.length === 0 ? (
            <Empty text="아직 게시글이 없습니다." />
          ) : (
            <ul className="divide-y divide-line">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link href={`/board/${post.id}`} className="flex items-center gap-2.5 px-5 py-3 transition hover:bg-canvas">
                    <Avatar name={post.authorName} path={post.authorAvatar} size="xs" />
                    <span className="truncate text-[14px]">{post.title}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-faint">
                      {formatRelative(post.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="새 사진" action={<MoreLink href="/album" />} />
          {recentAlbums.length === 0 ? (
            <Empty text="아직 등록된 사진이 없습니다." />
          ) : (
            <ul className="grid grid-cols-2 gap-2.5 p-5 sm:grid-cols-4">
              {recentAlbums.map((album) => (
                <li key={album.id}>
                  <Link href={`/album/${album.id}`} className="group block">
                    <div className="aspect-square overflow-hidden rounded-xl border border-line bg-canvas">
                      {album.coverPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbUrl(album.coverThumb, album.coverPath) ?? ''}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                        />
                      ) : null}
                    </div>
                    <p className="mt-1.5 truncate text-[12px] text-subtle">{album.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function MoreLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[12px] text-faint transition hover:text-ink"
    >
      더 보기
      <ArrowRight className="h-3 w-3" aria-hidden />
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-9 text-center text-[13px] text-subtle">{text}</p>;
}
