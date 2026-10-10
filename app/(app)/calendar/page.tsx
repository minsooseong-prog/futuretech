import type { Metadata } from 'next';
import { and, asc, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { formatDayLabel, todaySeoul } from '@/lib/utils/date';
import { isStaff } from '@/lib/utils/student';
import { CalendarView } from '@/components/calendar/CalendarView';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '캘린더' };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser();
  const today = todaySeoul();
  const raw = (await searchParams).month;
  const month = raw && /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : today.slice(0, 7);

  const [y, m] = month.split('-').map(Number);
  // 6주 그리드에 보이는 앞뒤 날짜까지 포함해 조회합니다.
  const gridStart = new Date(Date.UTC(y, m - 1, 1 - 7)).toISOString().slice(0, 10);
  const gridEnd = new Date(Date.UTC(y, m, 14)).toISOString().slice(0, 10);

  const columns = {
    id: calendarEvents.id,
    title: calendarEvents.title,
    description: calendarEvents.description,
    startDate: calendarEvents.startDate,
    endDate: calendarEvents.endDate,
    allDay: calendarEvents.allDay,
    startTime: calendarEvents.startTime,
    endTime: calendarEvents.endTime,
    createdBy: calendarEvents.createdBy,
  };

  const [events, upcoming] = await Promise.all([
    db
      .select(columns)
      .from(calendarEvents)
      .where(and(lte(calendarEvents.startDate, gridEnd), gte(calendarEvents.endDate, gridStart)))
      .orderBy(asc(calendarEvents.startDate), asc(calendarEvents.startTime)),
    db
      .select(columns)
      .from(calendarEvents)
      .where(gte(calendarEvents.endDate, today))
      .orderBy(asc(calendarEvents.startDate))
      .limit(8),
  ]);

  return (
    <div>
      <PageHeader title="캘린더" description="Future Tech 수업과 행사 일정입니다." />
      <CalendarView
        key={month}
        month={month}
        today={today}
        events={events}
        needsPassword={!isStaff(user.role)}
        userId={user.id}
        isAdmin={user.role === 'admin'}
      />
      <section className="card mt-6 p-5" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title" className="section-title mb-3">다가오는 일정</h2>
        {upcoming.length === 0 ? (
          <p className="py-4 text-sm text-muted">예정된 일정이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 text-sm">
                <span className="w-32 shrink-0 text-xs font-medium text-muted">{formatDayLabel(e.startDate)}</span>
                <span className="min-w-0 flex-1 font-medium">{e.title}</span>
                <span className="text-xs text-muted">{e.allDay ? '하루 종일' : e.startTime}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
