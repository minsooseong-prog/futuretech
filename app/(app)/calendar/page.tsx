import type { Metadata } from 'next';
import Link from 'next/link';
import { and, asc, gte, lte } from 'drizzle-orm';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { MonthGrid } from '@/components/calendar/month-grid';
import { EventList, type EventItem } from '@/components/calendar/event-list';
import { AddEventButton } from '@/components/calendar/event-dialog';
import { CardHeader } from '@/components/ui/card';
import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { isStaff, requireUser } from '@/lib/auth/guard';
import { daysInMonth, monthLabel, todayISO, toISODate } from '@/lib/utils/date';

export const metadata: Metadata = { title: '캘린더 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; d?: string }>;
}) {
  const user = await requireUser();
  const staff = isStaff(user);
  const params = await searchParams;

  const today = todayISO();
  const [todayYear, todayMonth] = today.split('-').map(Number);

  const year = Number(params.y) || todayYear;
  const month = Math.min(12, Math.max(1, Number(params.m) || todayMonth));
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(params.d ?? '') ? params.d! : today;

  // Pull one month plus a margin so multi-day events crossing the edge show up.
  const rangeStart = toISODate(year, month, 1);
  const rangeEnd = toISODate(year, month, daysInMonth(year, month));

  const monthEvents = await db
    .select()
    .from(calendarEvents)
    .where(and(lte(calendarEvents.startDate, rangeEnd), gte(calendarEvents.endDate, rangeStart)))
    .orderBy(asc(calendarEvents.startDate));

  const upcoming = await db
    .select()
    .from(calendarEvents)
    .where(gte(calendarEvents.endDate, today))
    .orderBy(asc(calendarEvents.startDate))
    .limit(8);

  const toItem = (event: typeof calendarEvents.$inferSelect): EventItem => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    allDay: event.allDay,
    startTime: event.startTime,
    endTime: event.endTime,
    createdByName: event.createdByName,
    canDelete: staff || event.createdBy === user.id,
  });

  const selectedEvents = monthEvents
    .filter((e) => e.startDate <= selected && e.endDate >= selected)
    .map(toItem);

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <>
      <PageHeader
        title="캘린더"
        description="미래공학 수업 일정과 학급 행사."
        action={<AddEventButton isStaff={staff} defaultDate={selected} />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-3 flex items-center gap-1">
            <h2 className="mr-2 text-[17px] font-semibold tracking-tight">{monthLabel(year, month)}</h2>
            <Link
              href={`/calendar?y=${prev.y}&m=${prev.m}`}
              aria-label="이전 달"
              className="rounded-lg border border-line p-1.5 text-subtle transition hover:text-ink"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={`/calendar?y=${next.y}&m=${next.m}`}
              aria-label="다음 달"
              className="rounded-lg border border-line p-1.5 text-subtle transition hover:text-ink"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/calendar"
              className="ml-1 rounded-lg border border-line px-2.5 py-1.5 text-[13px] text-subtle transition hover:text-ink"
            >
              오늘
            </Link>
          </div>

          <MonthGrid
            year={year}
            month={month}
            selected={selected}
            events={monthEvents.map((e) => ({
              id: e.id,
              title: e.title,
              startDate: e.startDate,
              endDate: e.endDate,
            }))}
          />
        </div>

        <div className="space-y-5">
          <section className="card overflow-hidden">
            <CardHeader title={`${Number(selected.slice(5, 7))}월 ${Number(selected.slice(8, 10))}일`} />
            <EventList events={selectedEvents} emptyText="이 날은 일정이 없습니다." />
          </section>

          <section className="card overflow-hidden">
            <CardHeader title="다가오는 일정" />
            <EventList events={upcoming.map(toItem)} emptyText="예정된 일정이 없습니다." />
          </section>
        </div>
      </div>
    </>
  );
}
