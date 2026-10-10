'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmAction } from '@/components/ui/ConfirmAction';
import { EventForm } from '@/components/calendar/EventForm';
import { deleteCalendarEvent } from '@/lib/actions/calendar';
import { formatDayLabel } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  createdBy: string | null;
};

type Props = {
  month: string; // YYYY-MM
  today: string; // YYYY-MM-DD
  events: CalendarEvent[];
  needsPassword: boolean;
  userId: string;
  isAdmin: boolean;
};

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function CalendarView({ month, today, events, needsPassword, userId, isAdmin }: Props) {
  const [y, m] = month.split('-').map(Number);
  const [selected, setSelected] = useState<string>(today.startsWith(month) ? today : `${month}-01`);
  const [adding, setAdding] = useState(false);
  const closeAdd = useCallback(() => setAdding(false), []);

  // 일요일 시작, 6주(42칸) 그리드
  const days = useMemo(() => {
    const first = new Date(Date.UTC(y, m - 1, 1));
    const start = new Date(first);
    start.setUTCDate(1 - first.getUTCDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      return ymd(d);
    });
  }, [y, m]);

  const eventsOn = useCallback((day: string) => events.filter((e) => e.startDate <= day && e.endDate >= day), [events]);
  const selectedEvents = eventsOn(selected);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="card overflow-hidden" aria-label={`${y}년 ${m}월 달력`}>
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <h2 className="text-lg font-semibold tabular-nums tracking-[-0.02em]">
            {y}년 {m}월
          </h2>
          <div className="ml-auto flex items-center gap-1">
            <Link href={`/calendar?month=${shiftMonth(month, -1)}`} className="icon-btn" aria-label="이전 달">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link href="/calendar" className="btn-secondary btn-sm">
              오늘
            </Link>
            <Link href={`/calendar?month=${shiftMonth(month, 1)}`} className="icon-btn" aria-label="다음 달">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-line text-center text-xs text-muted" aria-hidden="true">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={cn('py-2', i === 0 && 'text-danger/80')}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const inMonth = day.startsWith(month);
            const dayEvents = eventsOn(day);
            const isToday = day === today;
            const isSelected = day === selected;
            return (
              <button
                key={day}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${formatDayLabel(day)}${dayEvents.length ? `, 일정 ${dayEvents.length}개` : ''}`}
                onClick={() => setSelected(day)}
                className={cn(
                  'relative flex min-h-[4.5rem] flex-col items-stretch gap-1 border-line p-1.5 text-left transition-colors sm:min-h-[6rem]',
                  i % 7 !== 6 && 'border-r',
                  i < 35 && 'border-b',
                  isSelected ? 'bg-subtle' : 'hover:bg-subtle/60',
                  !inMonth && 'text-muted/50',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-6 w-6 items-center justify-center self-start rounded-full text-xs tabular-nums',
                    isToday && 'bg-ink font-semibold text-canvas',
                  )}
                >
                  {Number(day.slice(8))}
                </span>
                <span className="hidden flex-col gap-0.5 sm:flex">
                  {dayEvents.slice(0, 2).map((e) => (
                    <span key={e.id} className="truncate rounded bg-ink/[0.07] px-1.5 py-0.5 text-[0.68rem] leading-tight text-ink">
                      {e.title}
                    </span>
                  ))}
                  {dayEvents.length > 2 && <span className="px-1 text-[0.68rem] text-muted">+{dayEvents.length - 2}</span>}
                </span>
                {dayEvents.length > 0 && (
                  <span className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5 sm:hidden" aria-hidden="true">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className="h-1 w-1 rounded-full bg-ink" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="card p-5" aria-live="polite">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">{formatDayLabel(selected)}</h2>
            <button type="button" onClick={() => setAdding(true)} className="btn-primary btn-sm">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              일정 추가
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="py-4 text-sm text-muted">이 날에는 일정이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-line">
              {selectedEvents.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {e.allDay ? '하루 종일' : `${e.startTime ?? ''}${e.endTime ? ` ~ ${e.endTime}` : ''}`}
                        {e.startDate !== e.endDate && ` (${formatDayLabel(e.startDate)} ~ ${formatDayLabel(e.endDate)})`}
                      </p>
                      {e.description && <p className="prose-plain mt-1.5 text-sm text-muted">{e.description}</p>}
                    </div>
                    {(e.createdBy === userId || isAdmin) && (
                      <ConfirmAction
                        action={deleteCalendarEvent.bind(null, e.id)}
                        label={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                        ariaLabel={`${e.title} 일정 삭제`}
                        className="h-7 px-2"
                        title="일정을 삭제할까요?"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      <Modal
        open={adding}
        onClose={closeAdd}
        title="일정 추가"
        description={needsPassword ? '일정을 추가하려면 비밀번호가 필요합니다.' : undefined}
      >
        <EventForm date={selected} needsPassword={needsPassword} onDone={closeAdd} />
      </Modal>
    </div>
  );
}
