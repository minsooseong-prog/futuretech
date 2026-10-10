import type { Metadata } from 'next';
import Link from 'next/link';
import { asc, desc, eq, gte, inArray } from 'drizzle-orm';
import { CalendarDays, Images, Megaphone, MessagesSquare, Pin } from 'lucide-react';
import { db } from '@/lib/db';
import { albumImages, albumPosts, boardPosts, calendarEvents, notices, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { signImagePaths } from '@/lib/supabase/server';
import { formatStudentInfo } from '@/lib/utils/student';
import { formatDayLabel, formatRelative, todaySeoul } from '@/lib/utils/date';
import { categoryLabel } from '@/lib/constants';

export const metadata: Metadata = { title: '홈' };

function Section({ title, href, icon: Icon, children }: { title: string; href: string; icon: typeof Megaphone; children: React.ReactNode }) {
  return (
    <section className="card p-5" aria-labelledby={`sec-${href.slice(1)}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 id={`sec-${href.slice(1)}`} className="section-title flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
          {title}
        </h2>
        <Link href={href} className="text-xs text-muted hover:text-ink">
          전체 보기
        </Link>
      </div>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="py-6 text-center text-sm text-muted">{children}</p>;

export default async function HomePage() {
  const user = await requireUser();
  const today = todaySeoul();

  const [recentNotices, recentPosts, recentAlbums, upcoming] = await Promise.all([
    db
      .select({ id: notices.id, title: notices.title, pinned: notices.pinned, createdAt: notices.createdAt })
      .from(notices)
      .orderBy(desc(notices.pinned), desc(notices.createdAt))
      .limit(4),
    db
      .select({ id: boardPosts.id, title: boardPosts.title, category: boardPosts.category, createdAt: boardPosts.createdAt, author: users.name })
      .from(boardPosts)
      .leftJoin(users, eq(boardPosts.authorId, users.id))
      .orderBy(desc(boardPosts.createdAt))
      .limit(5),
    db
      .select({ id: albumPosts.id, title: albumPosts.title, createdAt: albumPosts.createdAt })
      .from(albumPosts)
      .orderBy(desc(albumPosts.createdAt))
      .limit(6),
    db
      .select({ id: calendarEvents.id, title: calendarEvents.title, startDate: calendarEvents.startDate, endDate: calendarEvents.endDate, startTime: calendarEvents.startTime, allDay: calendarEvents.allDay })
      .from(calendarEvents)
      .where(gte(calendarEvents.endDate, today))
      .orderBy(asc(calendarEvents.startDate))
      .limit(5),
  ]);

  const covers = recentAlbums.length
    ? await db
        .select({ albumPostId: albumImages.albumPostId, storagePath: albumImages.storagePath })
        .from(albumImages)
        .where(inArray(albumImages.albumPostId, recentAlbums.map((a) => a.id)))
        .orderBy(asc(albumImages.sortOrder))
    : [];
  const coverByAlbum = new Map<string, string>();
  for (const c of covers) if (!coverByAlbum.has(c.albumPostId)) coverByAlbum.set(c.albumPostId, c.storagePath);
  const urlOf = await signImagePaths([...coverByAlbum.values()]);

  return (
    <div className="space-y-6">
      <header className="pb-2">
        <h1 className="page-title">안녕하세요, {user.name}님.</h1>
        <p className="mt-1 text-sm text-muted">{formatStudentInfo(user)}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="최근 공지" href="/notices" icon={Megaphone}>
          {recentNotices.length === 0 ? (
            <Empty>아직 공지가 없습니다.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {recentNotices.map((n) => (
                <li key={n.id}>
                  <Link href={`/notices/${n.id}`} className="flex items-center gap-2 py-2.5 text-sm hover:underline">
                    {n.pinned && <Pin className="h-3.5 w-3.5 shrink-0" aria-label="고정 공지" />}
                    <span className="min-w-0 flex-1 truncate">{n.title}</span>
                    <span className="shrink-0 text-xs text-muted">{formatRelative(n.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="다가오는 일정" href="/calendar" icon={CalendarDays}>
          {upcoming.length === 0 ? (
            <Empty>예정된 일정이 없습니다.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-baseline gap-3 py-2.5 text-sm">
                  <span className="w-28 shrink-0 text-xs font-medium text-muted">{formatDayLabel(e.startDate)}</span>
                  <span className="min-w-0 flex-1 truncate">{e.title}</span>
                  {!e.allDay && e.startTime && <span className="shrink-0 text-xs text-muted">{e.startTime}</span>}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="게시판 새 글" href="/board" icon={MessagesSquare}>
        {recentPosts.length === 0 ? (
          <Empty>아직 게시글이 없습니다.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {recentPosts.map((p) => (
              <li key={p.id}>
                <Link href={`/board/${p.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:underline">
                  <span className="chip shrink-0">{categoryLabel(p.category)}</span>
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                  <span className="hidden shrink-0 text-xs text-muted sm:inline">{p.author ?? '졸업생'}</span>
                  <span className="shrink-0 text-xs text-muted">{formatRelative(p.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="최근 앨범" href="/album" icon={Images}>
        {recentAlbums.length === 0 ? (
          <Empty>아직 등록된 사진이 없습니다.</Empty>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {recentAlbums.map((a) => {
              const cover = coverByAlbum.get(a.id);
              const src = cover ? urlOf(cover).thumb : null;
              return (
                <li key={a.id}>
                  <Link href={`/album/${a.id}`} className="group block">
                    <div className="aspect-square overflow-hidden rounded-lg border border-line bg-subtle">
                      {src && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-xs">{a.title}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
