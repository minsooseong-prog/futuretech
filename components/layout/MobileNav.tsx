'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { isActive, navItems } from '@/components/layout/nav-items';
import { cn } from '@/lib/utils/cn';

const PRIMARY = ['/home', '/album', '/board', '/calendar'];

export function MobileNav({ userId }: { userId: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItems(userId);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <nav
        aria-label="하단 메뉴"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {items
            .filter((i) => PRIMARY.includes(i.href))
            .map((item) => {
              const active = isActive(pathname, item.match);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn('flex h-14 flex-col items-center justify-center gap-1 text-[0.68rem]', active ? 'font-semibold text-ink' : 'text-muted')}
                  >
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-drawer"
              className="flex h-14 w-full flex-col items-center justify-center gap-1 text-[0.68rem] text-muted"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
              메뉴
            </button>
          </li>
        </ul>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="전체 메뉴" id="mobile-drawer">
          <button type="button" aria-label="메뉴 닫기" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 animate-fade-in rounded-t-2xl border-t border-line bg-card px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">전체 메뉴</p>
              <button type="button" onClick={() => setOpen(false)} className="icon-btn" aria-label="닫기" autoFocus>
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action="/search" className="mb-3">
              <label htmlFor="m-search" className="sr-only">검색</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input id="m-search" name="q" type="search" placeholder="게시글, 공지, 멤버 검색" className="input pl-9" maxLength={50} />
              </div>
            </form>
            <ul className="grid grid-cols-2 gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.match);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn('flex h-12 items-center gap-3 rounded-lg px-3 text-sm', active ? 'bg-subtle font-semibold' : 'hover:bg-subtle')}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
