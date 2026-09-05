import Link from 'next/link';
import { buildMonthGrid, todayISO, WEEKDAY_LABELS } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

export type CalendarEntry = { id: string; title: string; startDate: string; endDate: string };

/**
 * Server-rendered month view. Selecting a day is a link, not client state, so
 * the day's events arrive with the page and a URL can be shared.
 */
export function MonthGrid({
  year,
  month,
  events,
  selected,
}: {
  year: number;
  month: number;
  events: CalendarEntry[];
  selected: string;
}) {
  const cells = buildMonthGrid(year, month);
  const today = todayISO();

  const eventsOn = (iso: string) => events.filter((e) => e.startDate <= iso && e.endDate >= iso);

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              'py-2.5 text-center text-[12px] font-medium',
              index === 0 && 'text-danger',
              index === 6 && 'text-subtle',
              index > 0 && index < 6 && 'text-faint',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          const dayEvents = eventsOn(cell.iso);
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selected;
          const weekday = index % 7;

          return (
            <Link
              key={cell.iso + index}
              href={`/calendar?y=${year}&m=${month}&d=${cell.iso}`}
              aria-current={isSelected ? 'date' : undefined}
              className={cn(
                'min-h-[86px] border-b border-r border-line p-1.5 transition sm:min-h-[110px]',
                index % 7 === 6 && 'border-r-0',
                index >= 35 && 'border-b-0',
                !cell.inMonth && 'bg-canvas/60',
                isSelected ? 'bg-line/50' : 'hover:bg-canvas',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[12px] tabular-nums',
                  !cell.inMonth && 'text-faint',
                  cell.inMonth && weekday === 0 && 'text-danger',
                  cell.inMonth && weekday !== 0 && 'text-ink',
                  isToday && 'bg-ink font-semibold text-canvas',
                )}
              >
                {cell.day}
              </span>

              <ul className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => (
                  <li
                    key={event.id}
                    className="truncate rounded border-l-2 border-ink bg-line/50 px-1 py-0.5 text-[10px] leading-tight"
                  >
                    {event.title}
                  </li>
                ))}
                {dayEvents.length > 2 && (
                  <li className="px-1 text-[10px] text-faint">+{dayEvents.length - 2}</li>
                )}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
