'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isActive, navItems } from '@/components/layout/nav-items';
import { cn } from '@/lib/utils/cn';

export function Sidebar({ userId }: { userId: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="주 메뉴" className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-56 shrink-0 border-r border-line px-3 py-6 md:block">
      <ul className="space-y-0.5">
        {navItems(userId).map((item) => {
          const active = isActive(pathname, item.match);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
                  active ? 'bg-subtle font-semibold text-ink' : 'text-muted hover:bg-subtle hover:text-ink',
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
