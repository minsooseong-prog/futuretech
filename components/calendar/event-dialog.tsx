'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Textarea } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { PasswordGate } from '@/components/ui/password-gate';
import { useToast } from '@/components/ui/toast';
import { createCalendarEvent } from '@/actions/calendar';
import type { ActionResult } from '@/lib/utils/errors';

export function AddEventButton({
  isStaff,
  defaultDate,
}: {
  isStaff: boolean;
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [allDay, setAllDay] = useState(true);
  const router = useRouter();
  const { notify } = useToast();

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await createCalendarEvent(prev, formData);
      if (result.ok) {
        notify(result.message ?? '일정을 추가했습니다.');
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden />
        일정 추가
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="일정 추가"
        description={
          isStaff ? '선생님 계정은 비밀번호 없이 추가할 수 있습니다.' : '일정 추가 비밀번호가 필요합니다.'
        }
      >
        <form action={formAction} className="space-y-4" noValidate>
          <Input
            label="일정 이름"
            name="title"
            required
            maxLength={120}
            placeholder="예) 로봇 경진대회"
            error={fieldErrors?.title}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="시작일"
              name="startDate"
              type="date"
              required
              defaultValue={defaultDate}
              error={fieldErrors?.startDate}
            />
            <Input
              label="종료일"
              name="endDate"
              type="date"
              defaultValue={defaultDate}
              error={fieldErrors?.endDate}
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-black dark:accent-white"
            />
            하루 종일
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="시작 시간"
                name="startTime"
                type="time"
                defaultValue="09:00"
                error={fieldErrors?.startTime}
              />
              <Input label="종료 시간" name="endTime" type="time" defaultValue="10:00" error={fieldErrors?.endTime} />
            </div>
          )}

          <Textarea
            label="설명 (선택)"
            name="description"
            rows={3}
            maxLength={2000}
            error={fieldErrors?.description}
          />

          {!isStaff && (
            <PasswordGate
              label="일정 추가 비밀번호"
              hint="선생님께 받은 비밀번호를 입력하세요."
              error={fieldErrors?.password}
            />
          )}

          {state && !state.ok && !fieldErrors && <FormMessage error={state.error} />}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              취소
            </Button>
            <Button type="submit" loading={pending}>
              추가
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
