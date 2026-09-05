'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { deleteCalendarEvent } from '@/actions/calendar';
import { formatDate } from '@/lib/utils/date';

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  createdByName: string;
  canDelete: boolean;
};

export function EventList({ events, emptyText }: { events: EventItem[]; emptyText: string }) {
  const router = useRouter();
  const { notify } = useToast();

  async function remove(id: string) {
    const result = await deleteCalendarEvent(id);
    notify(result.ok ? (result.message ?? '삭제했습니다.') : result.error, result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  if (events.length === 0) {
    return <p className="px-5 py-8 text-center text-[13px] text-subtle">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium">{event.title}</p>
            <p className="mt-0.5 text-[12px] text-faint">
              {formatDate(`${event.startDate}T00:00:00+09:00`)}
              {event.endDate !== event.startDate && ` – ${formatDate(`${event.endDate}T00:00:00+09:00`)}`}
              {!event.allDay && event.startTime && ` · ${event.startTime}~${event.endTime ?? ''}`}
              {` · ${event.createdByName}`}
            </p>
            {event.description && (
              <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-subtle">
                {event.description}
              </p>
            )}
          </div>

          {event.canDelete && (
            <button
              type="button"
              onClick={() => remove(event.id)}
              aria-label={`${event.title} 일정 삭제`}
              className="rounded-md p-1.5 text-faint transition hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
