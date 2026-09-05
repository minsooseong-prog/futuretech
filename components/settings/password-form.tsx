'use client';

import { useActionState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { useToast } from '@/components/ui/toast';
import { changeOwnPassword } from '@/actions/settings';
import type { ActionResult } from '@/lib/utils/errors';

export function PasswordForm() {
  const { notify } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await changeOwnPassword(prev, formData);
      if (result.ok) {
        notify(result.message ?? '비밀번호를 바꿨습니다.');
        formRef.current?.reset();
      }
      return result;
    },
    null as ActionResult | null,
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <Input
        label="현재 비밀번호"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        error={fieldErrors?.currentPassword}
      />
      <Input
        label="새 비밀번호"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={5}
        error={fieldErrors?.newPassword}
      />
      <Input
        label="새 비밀번호 확인"
        name="newPasswordConfirm"
        type="password"
        autoComplete="new-password"
        required
        error={fieldErrors?.newPasswordConfirm}
      />

      {state && !state.ok && !fieldErrors && <FormMessage error={state.error} />}

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          비밀번호 변경
        </Button>
      </div>
    </form>
  );
}
