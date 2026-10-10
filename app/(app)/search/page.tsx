import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq, ilike, or } from 'drizzle-orm';
import { Search } from 'lucide-react';
import { db } from '@/lib/db';
import { boardPosts, notices, users } from '@/lib/db/schema';
import { signUrls } from '@/lib/supabase/server';
import { categoryLabel } from '@/lib/constants';
import { formatRelative } from '@/lib/utils/date';
import { formatStudentInfo } from '@/lib/utils/student';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '검색' };

// LIKE 특수문자(%, _, \)를 이스케이프해 사용자가 와일드카드를 주입하지 못하게 합니다.
const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? '').trim().slice(0, 50);

  const form = (
    <form action="/search" role="search" className="mb-8">
      <label htmlFor="search-q" className="sr-only">검색어</label>
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input id="search-q" name="q" type="search" defaultValue={q} maxLength={50} autoFocus placeholder="게시글, 공지, 멤버 이름" className="input h-11 pl-9" />
      </div>
    </form>
  );

  if (!q) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="검색" />
        {form}
        <p className="text-sm text-muted">게시판 제목과 본문, 공지, 멤버 이름을 찾을 수 있습니다.</p>
      </div>
    );
  }

  const pattern = likePattern(q);
  const [posts, noticeRows, memberRows] = await Promise.all([
    db
      .select({ id: boardPosts.id, title: boardPosts.title, category: boardPosts.category, createdAt: boardPosts.createdAt, author: users.name })
      .from(boardPosts)
      .leftJoin(users, eq(boardPosts.authorId, users.id))
      .where(or(ilike(boardPosts.title, pattern), ilike(boardPosts.content, pattern)))
      .orderBy(desc(boardPosts.createdAt))
      .limit(20),
    db
      .select({ id: notices.id, title: notices.title, createdAt: notices.createdAt })
      .from(notices)
      .where(or(ilike(notices.title, pattern), ilike(notices.content, pattern)))
      .orderBy(desc(notices.createdAt))
      .limit(10),
    db
      .select({ id: users.id, name: users.name, role: users.role, grade: users.grade, classNumber: users.classNumber, studentNumber: users.studentNumber, avatarPath: users.avatarPath })
      .from(users)
      .where(ilike(users.name, pattern))
      .limit(20),
  ]);
  const urls = await signUrls(memberRows.map((m) => m.avatarPath));
  const total = posts.length + noticeRows.length + memberRows.length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="검색" description={`'${q}' 검색 결과 ${total}건`} />
      {form}

      {total === 0 && <p className="card px-5 py-10 text-center text-sm text-muted">일치하는 결과가 없습니다. 다른 단어로 검색해보세요.</p>}

      {memberRows.length > 0 && (
        <section className="mb-8" aria-labelledby="sr-members">
          <h2 id="sr-members" className="section-title mb-3">멤버</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {memberRows.map((m) => (
              <li key={m.id}>
                <Link href={`/profile/${m.id}`} className="card flex items-center gap-3 p-3 hover:border-ink/25">
                  <Avatar src={m.avatarPath ? urls[m.avatarPath] : null} name={m.name} size={36} />
                  <span>
                    <span className="block text-sm font-medium">{m.name}</span>
                    <span className="block text-xs text-muted">{formatStudentInfo(m)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {noticeRows.length > 0 && (
        <section className="mb-8" aria-labelledby="sr-notices">
          <h2 id="sr-notices" className="section-title mb-3">공지사항</h2>
          <ul className="card divide-y divide-line">
            {noticeRows.map((n) => (
              <li key={n.id}>
                <Link href={`/notices/${n.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-subtle/50">
                  <span className="min-w-0 flex-1 truncate">{n.title}</span>
                  <span className="text-xs text-muted">{formatRelative(n.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length > 0 && (
        <section aria-labelledby="sr-posts">
          <h2 id="sr-posts" className="section-title mb-3">게시판</h2>
          <ul className="card divide-y divide-line">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/board/${p.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-subtle/50">
                  <span className="chip shrink-0">{categoryLabel(p.category)}</span>
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                  <span className="hidden text-xs text-muted sm:inline">{p.author ?? '졸업생'}</span>
                  <span className="text-xs text-muted">{formatRelative(p.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
