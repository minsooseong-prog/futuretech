'use client';

import { useActionState, useEffect, useState } from 'react';
import { createCalendarEvent } from '@/lib/actions/calendar';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function EventForm({ date, needsPassword, onDone }: { date: string; needsPassword: boolean; onDone: () => void }) {
  const [state, formAction] = useActionState(createCalendarEvent, undefined);
  const [allDay, setAllDay] = useState(true);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="ev-title" className="label">제목</label>
        <input id="ev-title" name="title" required maxLength={60} className="input" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ev-start" className="label">시작일</label>
          <input id="ev-start" name="startDate" type="date" required defaultValue={date} className="input" />
        </div>
        <div>
          <label htmlFor="ev-end" className="label">종료일</label>
          <input id="ev-end" name="endDate" type="date" defaultValue={date} className="input" />
        </div>
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" name="allDay" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-4 w-4 accent-current" />
        하루 종일
      </label>
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ev-st" className="label">시작 시간</label>
            <input id="ev-st" name="startTime" type="time" required className="input" />
          </div>
          <div>
            <label htmlFor="ev-et" className="label">종료 시간</label>
            <input id="ev-et" name="endTime" type="time" className="input" />
          </div>
        </div>
      )}
      <div>
        <label htmlFor="ev-desc" className="label">설명</label>
        <textarea id="ev-desc" name="description" maxLength={500} rows={3} className="textarea min-h-[5rem]" />
      </div>
      {needsPassword && (
        <div>
          <label htmlFor="ev-pw" className="label">일정 추가 비밀번호</label>
          <input id="ev-pw" name="gatePassword" type="password" required maxLength={72} autoComplete="off" className="input" />
          <p className="hint">선생님께 받은 비밀번호를 입력하세요.</p>
        </div>
      )}
      <FormMessage error={state?.error} />
      <div className="flex justify-end">
        <SubmitButton>일정 추가</SubmitButton>
      </div>
    </form>
  );
}
