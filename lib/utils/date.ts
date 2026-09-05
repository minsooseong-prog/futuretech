const TZ = 'Asia/Seoul';

function parts(date: Date) {
  const fmt = new Intl.DateTimeFormat('ko-KR', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  return out;
}

/** 2026.09.05 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const p = parts(d);
  return `${p.year}.${p.month}.${p.day}`;
}

/** 2026.09.05 14:32 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const p = parts(d);
  const hour = p.hour === '24' ? '00' : p.hour;
  return `${p.year}.${p.month}.${p.day} ${hour}:${p.minute}`;
}

/** 방금 전 / 5분 전 / 3시간 전 / 2026.09.05 */
export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);

  if (diff < 0) return formatDate(d);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return formatDate(d);
}

/** Board lists show a clock for today's posts and a date for anything older. */
export function formatListDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = parts(new Date());
  const then = parts(d);
  if (now.year === then.year && now.month === then.month && now.day === then.day) {
    const hour = then.hour === '24' ? '00' : then.hour;
    return `${hour}:${then.minute}`;
  }
  return `${then.month}.${then.day}`;
}

/* ------------------------------------------------------------------ */
/* Calendar helpers — all dates handled as plain YYYY-MM-DD strings so  */
/* that a class schedule never shifts because of a timezone offset.     */
/* ------------------------------------------------------------------ */

export function todayISO(): string {
  const p = parts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

export function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

export type CalendarCell = { iso: string; day: number; inMonth: boolean };

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const lead = firstWeekdayOfMonth(year, month);
  const total = daysInMonth(year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevTotal = daysInMonth(prevYear, prevMonth);

  for (let i = lead - 1; i >= 0; i--) {
    const day = prevTotal - i;
    cells.push({ iso: toISODate(prevYear, prevMonth, day), day, inMonth: false });
  }
  for (let day = 1; day <= total; day++) {
    cells.push({ iso: toISODate(year, month, day), day, inMonth: true });
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let day = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ iso: toISODate(nextYear, nextMonth, day), day, inMonth: false });
    day++;
    if (cells.length >= 42) break;
  }
  return cells;
}

export function monthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
