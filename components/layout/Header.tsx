import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Wordmark } from '@/components/layout/Wordmark';

type Props = { userId: string; name: string; avatarUrl: string | null; hasNewNotice: boolean };

export function Header({ userId, name, avatarUrl, hasNewNotice }: Props) {
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 md:px-6">
        <Wordmark />
        <form action="/search" role="search" className="ml-auto hidden w-full max-w-sm md:block">
          <label htmlFor="global-search" className="sr-only">검색</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="global-search"
              name="q"
              type="search"
              maxLength={50}
              placeholder="게시글, 공지, 멤버 검색"
              className="input h-9 bg-subtle pl-9 hover:bg-card focus:bg-card"
            />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link href="/search" className="icon-btn md:hidden" aria-label="검색">
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <Link href="/notices" className="icon-btn relative" aria-label={hasNewNotice ? '공지사항 (새 공지 있음)' : '공지사항'}>
            <Bell className="h-[18px] w-[18px]" />
            {hasNewNotice && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-ink ring-2 ring-canvas" aria-hidden="true" />}
          </Link>
          <Link href={`/profile/${userId}`} className="ml-1 rounded-full" aria-label="내 프로필">
            <Avatar src={avatarUrl} name={name} size={32} />
          </Link>
        </div>
      </div>
    </header>
  );
}
