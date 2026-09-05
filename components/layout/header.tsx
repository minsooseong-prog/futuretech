import Link from 'next/link';
import { Suspense } from 'react';
import { NoticeBell, type BellNotice } from './notice-bell';
import { SearchBox } from './search-box';
import { UserMenu } from './user-menu';
import type { SessionUser } from '@/lib/auth/session';

export function Header({
  user,
  notices,
  unread,
}: {
  user: SessionUser;
  notices: BellNotice[];
  unread: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Link href="/home" className="flex shrink-0 items-baseline gap-1.5">
          <span className="text-[15px] font-semibold tracking-tight">Future</span>
          {/* A small handwritten accent carries the landing page into the app. */}
          <span className="font-hand text-2xl leading-none">Tech</span>
        </Link>

        <div className="ml-auto hidden max-w-xs flex-1 sm:ml-6 sm:block">
          <Suspense fallback={<div className="h-9" />}>
            <SearchBox />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
          <Link
            href="/search"
            aria-label="검색"
            className="rounded-lg p-2 text-subtle transition hover:bg-line/50 hover:text-ink sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
          <NoticeBell notices={notices} unread={unread} />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
