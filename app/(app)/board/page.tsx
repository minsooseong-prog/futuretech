import type { Metadata } from 'next';
import Link from 'next/link';
import { count, desc, eq, sql } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { CategoryFilter } from '@/components/board/category-filter';
import { PostList, type PostRow } from '@/components/board/post-list';
import { EmptyState } from '@/components/ui/empty-state';
import { db } from '@/lib/db';
import { boardImages, boardPosts, comments, users } from '@/lib/db/schema';
import { BOARD_CATEGORIES } from '@/lib/validation/schemas';
import { requireUser } from '@/lib/auth/guard';

export const metadata: Metadata = { title: '게시판 · Future Tech' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  await requireUser();
  const params = await searchParams;

  const category = BOARD_CATEGORIES.find((c) => c === params.category);
  const page = Math.max(1, Number(params.page) || 1);
  const where = category ? eq(boardPosts.category, category) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(boardPosts)
    .where(where);

  const rows = await db
    .select({
      id: boardPosts.id,
      category: boardPosts.category,
      title: boardPosts.title,
      createdAt: boardPosts.createdAt,
      views: boardPosts.views,
      likes: boardPosts.likes,
      authorId: users.id,
      authorName: users.name,
      commentCount: sql<number>`(select count(*) from ${comments} where ${comments.postId} = ${boardPosts.id})`,
      imageCount: sql<number>`(select count(*) from ${boardImages} where ${boardImages.postId} = ${boardPosts.id})`,
    })
    .from(boardPosts)
    .innerJoin(users, eq(users.id, boardPosts.authorId))
    .where(where)
    .orderBy(desc(boardPosts.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const posts: PostRow[] = rows.map((row, index) => ({
    ...row,
    commentCount: Number(row.commentCount),
    imageCount: Number(row.imageCount),
    number: total - (page - 1) * PAGE_SIZE - index,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="게시판"
        description="질문, 정보, 잡담까지 — 우리 반 이야기가 모이는 곳."
        action={
          <Link
            href="/board/new"
            className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-canvas transition hover:opacity-90"
          >
            글쓰기
          </Link>
        }
      />

      <CategoryFilter active={category} />

      {posts.length === 0 ? (
        <EmptyState
          title="아직 게시글이 없습니다."
          description="첫 번째 이야기를 시작해보세요."
          action={
            <Link
              href="/board/new"
              className="inline-flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-canvas transition hover:opacity-90"
            >
              글쓰기
            </Link>
          }
        />
      ) : (
        <>
          <PostList posts={posts} />
          <Pagination page={page} totalPages={totalPages} category={category} />
        </>
      )}
    </>
  );
}

function Pagination({
  page,
  totalPages,
  category,
}: {
  page: number;
  totalPages: number;
  category?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const search = new URLSearchParams();
    if (category) search.set('category', category);
    if (target > 1) search.set('page', String(target));
    const qs = search.toString();
    return qs ? `/board?${qs}` : '/board';
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2,
  );

  return (
    <nav aria-label="페이지" className="mt-6 flex items-center justify-center gap-1">
      {pages.map((p, index) => (
        <span key={p} className="flex items-center gap-1">
          {index > 0 && pages[index - 1] !== p - 1 && <span className="px-1 text-faint">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={
              p === page
                ? 'flex h-9 min-w-9 items-center justify-center rounded-lg bg-ink px-2.5 text-[13px] font-medium text-canvas'
                : 'flex h-9 min-w-9 items-center justify-center rounded-lg border border-line px-2.5 text-[13px] text-subtle transition hover:text-ink'
            }
          >
            {p}
          </Link>
        </span>
      ))}
    </nav>
  );
}
