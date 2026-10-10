const TZ = 'Asia/Seoul';

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function seoulParts(input: Date | string) {
  const d = typeof input === 'string' ? new Date(input) : input;
  const out: Record<string, string> = {};
  for (const p of partsFormatter.formatToParts(d)) out[p.type] = p.value;
  return out;
}

/** 2026.09.05 */
export function formatDate(input: Date | string) {
  const p = seoulParts(input);
  return `${p.year}.${p.month}.${p.day}`;
}

/** 2026.09.05 14:32 */
export function formatDateTime(input: Date | string) {
  const p = seoulParts(input);
  return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}

/** 방금 전 / 5분 전 / 3시간 전 / 2일 전 / 2026.09.05 */
export function formatRelative(input: Date | string) {
  const d = typeof input === 'string' ? new Date(input) : input;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}일 전`;
  return formatDate(d);
}

/** 서울 기준 오늘 날짜 YYYY-MM-DD */
export function todaySeoul() {
  const p = seoulParts(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

/** '2026-09-05' → '2026.09.05' */
export function formatDateString(ymd: string) {
  return ymd.replaceAll('-', '.');
}

/** '2026-09-05' → '9월 5일 (토)' */
export function formatDayLabel(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}월 ${d}일 (${'일월화수목금토'[day]})`;
}
