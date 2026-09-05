'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { logoutAction } from '@/actions/auth';
import { formatClassInfo, roleLabel } from '@/lib/utils/student-id';

export function UserMenu({
  user,
}: {
  user: {
    id: string;
    name: string;
    avatarPath: string | null;
    role: 'student' | 'teacher' | 'admin';
    grade: number | null;
    classNumber: number | null;
    studentNumber: number | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const detail =
    user.role === 'student'
      ? formatClassInfo(user.grade, user.classNumber, user.studentNumber)
      : roleLabel(user.role);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="내 계정"
        className="rounded-full transition hover:opacity-80"
      >
        <Avatar name={user.name} path={user.avatarPath} size="sm" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 animate-pop-in overflow-hidden rounded-xl border border-line bg-elevated shadow-pop"
        >
          <div className="px-4 py-3 hairline">
            <p className="truncate text-[13px] font-semibold">{user.name}</p>
            <p className="mt-0.5 text-[11px] text-faint">{detail}</p>
          </div>

          <Link
            href={`/profile/${user.id}`}
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-subtle transition hover:bg-canvas hover:text-ink"
          >
            <UserIcon className="h-4 w-4" aria-hidden />내 미니홈
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-subtle transition hover:bg-canvas hover:text-ink"
          >
            <Settings className="h-4 w-4" aria-hidden />
            설정
          </Link>

          <form action={logoutAction} className="border-t border-line">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-subtle transition hover:bg-canvas hover:text-ink"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
