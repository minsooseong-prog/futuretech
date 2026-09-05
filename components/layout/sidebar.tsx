'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ACCOUNT_ITEMS, NAV_ITEMS, type NavItem } from './nav-items';
import { cn } from '@/lib/utils/cn';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ userId }: { userId: string }) {
  const pathname = usePathname();
  const accountItems = ACCOUNT_ITEMS(userId);

  return (
    <nav
      aria-label="주요 메뉴"
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 border-r border-line px-3 py-5 lg:block"
    >
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <NavLink item={item} active={isActive(pathname, item.href)} />
          </li>
        ))}
      </ul>

      <div className="my-4 border-t border-line" />

      <ul className="space-y-0.5">
        {accountItems.map((item) => (
          <li key={item.href}>
            <NavLink item={item} active={isActive(pathname, item.href)} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
        active ? 'bg-line/70 font-medium text-ink' : 'text-subtle hover:bg-line/40 hover:text-ink',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {item.label}
    </Link>
  );
}
