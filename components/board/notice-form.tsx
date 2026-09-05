'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { PasswordGate } from '@/components/ui/password-gate';
import { useToast } from '@/components/ui/toast';
import type { ActionResult } from '@/lib/utils/errors';

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult<{ id: string }>>;

export function NoticeForm({
  action,
  isStaff,
  initial,
  submitLabel = '공지 올리기',
}: {
  action: Action;
  isStaff: boolean;
  initial?: { title: string; content: string; pinned: boolean };
  submitLabel?: string;
}) {
  const router = useRouter();
  const { notify } = useToast();

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok) {
        notify(result.message ?? '저장했습니다.');
        router.push(`/notices/${result.data?.id ?? ''}`);
        router.refresh();
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Input
        label="제목"
        name="title"
        required
        maxLength={120}
        defaultValue={initial?.title}
        error={fieldErrors?.title}
      />

      <Textarea
        label="내용"
        name="content"
        required
        rows={12}
        defaultValue={initial?.content}
        className="min-h-[240px]"
        error={fieldErrors?.content}
      />

      {isStaff ? (
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={initial?.pinned}
            className="h-4 w-4 rounded border-line accent-black dark:accent-white"
          />
          목록 맨 위에 고정
        </label>
      ) : (
        <PasswordGate
          label="공지 작성 비밀번호"
          hint="선생님께 받은 비밀번호를 입력하세요."
          error={fieldErrors?.password}
        />
      )}

      {state && !state.ok && !fieldErrors && <FormMessage error={state.error} />}

      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={pending}>
          취소
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
