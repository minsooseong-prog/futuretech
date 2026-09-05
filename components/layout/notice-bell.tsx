'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { formatRelative } from '@/lib/utils/date';

export type BellNotice = { id: string; title: string; createdAt: string };

export function NoticeBell({ notices, unread }: { notices: BellNotice[]; unread: boolean }) {
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={unread ? '새 공지사항 있음' : '공지사항'}
        className="relative rounded-lg p-2 text-subtle transition hover:bg-line/50 hover:text-ink"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {unread && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" aria-hidden />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-72 animate-pop-in overflow-hidden rounded-xl border border-line bg-elevated shadow-pop"
        >
          <p className="px-4 py-3 text-[13px] font-semibold hairline">최근 공지사항</p>
          {notices.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-subtle">아직 공지가 없습니다.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto scrollbar-thin">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <Link
                    href={`/notices/${notice.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 transition hover:bg-canvas"
                  >
                    <p className="truncate text-[13px] font-medium">{notice.title}</p>
                    <p className="mt-0.5 text-[11px] text-faint">{formatRelative(notice.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/notices"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-2.5 text-center text-[13px] text-subtle transition hover:bg-canvas hover:text-ink"
          >
            전체 보기
          </Link>
        </div>
      )}
    </div>
  );
}
