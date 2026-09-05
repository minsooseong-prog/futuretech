import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { desc, ilike, or, sql } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBox } from '@/components/layout/search-box';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { db } from '@/lib/db';
import { boardPosts, notices, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guard';
import { formatDate } from '@/lib/utils/date';
import { formatClassInfo, roleLabel } from '@/lib/utils/student-id';
import { excerpt } from '@/lib/utils/text';

export const metadata: Metadata = { title: '검색 · Future Tech' };
export const dynamic = 'force-dynamic';

const LIMIT = 10;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q } = await searchParams;
  const query = (q ?? '').trim().slice(0, 60);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="검색" description="게시글, 공지, 반 친구를 한 번에 찾습니다." />

      <div className="mb-6 max-w-md">
        <Suspense fallback={<div className="h-9" />}>
          <SearchBox />
        </Suspense>
      </div>

      {!query ? (
        <EmptyState title="무엇을 찾고 있나요?" description="제목, 내용, 이름으로 검색할 수 있습니다." />
      ) : (
        <Results query={query} />
      )}
    </div>
  );
}

async function Results({ query }: { query: string }) {
  // ILIKE with a trailing-and-leading wildcard is plenty for a class-sized
  // dataset and avoids maintaining a full-text index.
  const pattern = `%${query.replace(/[%_]/g, (m) => `\\${m}`)}%`;

  const [posts, noticeHits, people] = await Promise.all([
    db
      .select({
        id: boardPosts.id,
        title: boardPosts.title,
        content: boardPosts.content,
        category: boardPosts.category,
        createdAt: boardPosts.createdAt,
      })
      .from(boardPosts)
      .where(or(ilike(boardPosts.title, pattern), ilike(boardPosts.content, pattern)))
      .orderBy(desc(boardPosts.createdAt))
      .limit(LIMIT),

    db
      .select({
        id: notices.id,
        title: notices.title,
        content: notices.content,
        createdAt: notices.createdAt,
      })
      .from(notices)
      .where(or(ilike(notices.title, pattern), ilike(notices.content, pattern)))
      .orderBy(desc(notices.createdAt))
      .limit(LIMIT),

    db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        grade: users.grade,
        classNumber: users.classNumber,
        studentNumber: users.studentNumber,
        avatarPath: users.avatarPath,
      })
      .from(users)
      .where(ilike(users.name, pattern))
      .orderBy(sql`${users.grade} nulls last`, users.classNumber, users.studentNumber)
      .limit(LIMIT),
  ]);

  const total = posts.length + noticeHits.length + people.length;

  if (total === 0) {
    return (
      <EmptyState
        title={`"${query}" 검색 결과가 없습니다.`}
        description="다른 낱말로 다시 찾아보세요."
      />
    );
  }

  return (
    <div className="space-y-5">
      {noticeHits.length > 0 && (
        <Card>
          <CardHeader title={`공지사항 ${noticeHits.length}`} />
          <ul className="divide-y divide-line">
            {noticeHits.map((notice) => (
              <li key={notice.id}>
                <Link href={`/notices/${notice.id}`} className="block px-5 py-3.5 transition hover:bg-canvas">
                  <p className="truncate text-[14px] font-medium">{notice.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-subtle">
                    {excerpt(notice.content, 90)}
                  </p>
                  <p className="mt-1 text-[11px] text-faint">{formatDate(notice.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {posts.length > 0 && (
        <Card>
          <CardHeader title={`게시글 ${posts.length}`} />
          <ul className="divide-y divide-line">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/board/${post.id}`} className="block px-5 py-3.5 transition hover:bg-canvas">
                  <div className="flex items-center gap-2">
                    <Badge>{post.category}</Badge>
                    <span className="truncate text-[14px] font-medium">{post.title}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[12px] text-subtle">
                    {excerpt(post.content, 90)}
                  </p>
                  <p className="mt-1 text-[11px] text-faint">{formatDate(post.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {people.length > 0 && (
        <Card>
          <CardHeader title={`반 친구들 ${people.length}`} />
          <ul className="divide-y divide-line">
            {people.map((person) => (
              <li key={person.id}>
                <Link
                  href={`/profile/${person.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-canvas"
                >
                  <Avatar name={person.name} path={person.avatarPath} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{person.name}</p>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {person.role === 'student'
                        ? formatClassInfo(person.grade, person.classNumber, person.studentNumber)
                        : roleLabel(person.role)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
