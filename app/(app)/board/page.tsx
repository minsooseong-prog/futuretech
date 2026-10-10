import type { Metadata } from 'next';
import Link from 'next/link';
import { and, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { Image as ImageIcon, MessagesSquare, PenLine } from 'lucide-react';
import { db } from '@/lib/db';
import { boardImages, boardLikes, boardPosts, comments, users, type BoardCategory } from '@/lib/db/schema';
import { BOARD_CATEGORIES, LIMITS, categoryLabel } from '@/lib/constants';
import { formatRelative, formatDate } from '@/lib/utils/date';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = { title: '게시판' };

type Search = Promise<{ category?: string; page?: string }>;

function isToday(d: Date) {
  return formatDate(d) === formatDate(new Date());
}

export default async function BoardPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const category = BOARD_CATEGORIES.some((c) => c.value === sp.category) ? (sp.category as BoardCategory) : undefined;
  const page = Math.max(1, Math.min(1000, Number(sp.page) || 1));
  const size = LIMITS.boardPageSize;

  const where: SQL | undefined = category ? eq(boardPosts.category, category) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: boardPosts.id,
        category: boardPosts.category,
        title: boardPosts.title,
        views: boardPosts.views,
        createdAt: boardPosts.createdAt,
        author: users.name,
        commentCount: sql<number>`(select count(*) from ${comments} where ${comments.postId} = ${boardPosts.id})`.mapWith(Number),
        likeCount: sql<number>`(select count(*) from ${boardLikes} where ${boardLikes.postId} = ${boardPosts.id})`.mapWith(Number),
        hasImage: sql<boolean>`exists(select 1 from ${boardImages} where ${boardImages.postId} = ${boardPosts.id})`,
      })
      .from(boardPosts)
      .leftJoin(users, eq(boardPosts.authorId, users.id))
      .where(and(where))
      .orderBy(desc(boardPosts.id))
      .limit(size)
      .offset((page - 1) * size),
    db.select({ total: count() }).from(boardPosts).where(and(where)),
  ]);
  const pages = Math.max(1, Math.ceil(total / size));
  const href = (p: number, c = category) => `/board?${new URLSearchParams({ ...(c ? { category: c } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <div>
      <PageHeader
        title="게시판"
        description="자유롭게 이야기를 나누는 공간입니다."
        action={
          <Link href="/board/new" className="btn-primary">
            <PenLine className="h-4 w-4" aria-hidden="true" />
            글쓰기
          </Link>
        }
      />

      <nav aria-label="말머리 필터" className="-mx-4 mb-4 overflow-x-auto px-4">
        <ul className="flex gap-1.5">
          {[{ value: undefined, label: '전체' }, ...BOARD_CATEGORIES].map((c) => {
            const active = c.value === category;
            return (
              <li key={c.label}>
                <Link
                  href={href(1, c.value as BoardCategory | undefined)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-8 items-center rounded-full border px-3.5 text-sm transition-colors',
                    active ? 'border-ink bg-ink text-canvas' : 'border-line text-muted hover:border-ink/30 hover:text-ink',
                  )}
                >
                  {c.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="아직 게시글이 없습니다."
          description="첫 번째 이야기를 시작해보세요."
          action={<Link href="/board/new" className="btn-primary">글쓰기</Link>}
        />
      ) : (
        <>
          {/* 데스크톱: 표 */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">게시글 목록</caption>
              <thead className="border-b border-line bg-subtle/60 text-xs text-muted">
                <tr>
                  <th scope="col" className="w-16 py-3 font-medium">번호</th>
                  <th scope="col" className="w-20 font-medium">말머리</th>
                  <th scope="col" className="px-3 text-left font-medium">제목</th>
                  <th scope="col" className="w-28 font-medium">작성자</th>
                  <th scope="col" className="w-24 font-medium">날짜</th>
                  <th scope="col" className="w-14 font-medium">조회</th>
                  <th scope="col" className="w-14 font-medium">추천</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="text-center transition-colors hover:bg-subtle/50">
                    <td className="py-3 text-xs tabular-nums text-muted">{r.id}</td>
                    <td className="text-xs text-muted">{categoryLabel(r.category)}</td>
                    <td className="px-3 text-left">
                      <Link href={`/board/${r.id}`} className="inline-flex max-w-full items-center gap-1.5 hover:underline">
                        <span className="truncate">{r.title}</span>
                        {r.hasImage && <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="사진 포함" />}
                        {r.commentCount > 0 && <span className="shrink-0 text-xs font-semibold">[{r.commentCount}]</span>}
                      </Link>
                    </td>
                    <td className="truncate text-xs">{r.author ?? '졸업생'}</td>
                    <td className="text-xs tabular-nums text-muted">{isToday(r.createdAt) ? formatRelative(r.createdAt) : formatDate(r.createdAt).slice(2)}</td>
                    <td className="text-xs tabular-nums text-muted">{r.views}</td>
                    <td className="text-xs tabular-nums text-muted">{r.likeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 리스트 */}
          <ul className="card divide-y divide-line md:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/board/${r.id}`} className="block px-4 py-3.5">
                  <p className="flex items-center gap-1.5 text-[0.95rem]">
                    <span className="truncate">{r.title}</span>
                    {r.hasImage && <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="사진 포함" />}
                    {r.commentCount > 0 && <span className="shrink-0 text-xs font-semibold">[{r.commentCount}]</span>}
                  </p>
                  <p className="mt-1 flex gap-3 text-xs text-muted">
                    <span>{categoryLabel(r.category)}</span>
                    <span>{r.author ?? '졸업생'}</span>
                    <span>{formatRelative(r.createdAt)}</span>
                    <span>조회 {r.views}</span>
                    <span>추천 {r.likeCount}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <nav aria-label="페이지" className="mt-6 flex items-center justify-center gap-1">
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 4 || p === 1 || p === pages)
                .map((p) => (
                  <Link
                    key={p}
                    href={href(p)}
                    aria-current={p === page ? 'page' : undefined}
                    className={cn('inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm tabular-nums', p === page ? 'bg-ink text-canvas' : 'text-muted hover:bg-subtle')}
                  >
                    {p}
                  </Link>
                ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
