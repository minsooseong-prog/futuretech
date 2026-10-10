'use client';

import { useActionState, useEffect, useRef } from 'react';
import { changePassword } from '@/lib/actions/settings';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function PasswordChangeForm() {
  const [state, formAction] = useActionState(changePassword, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div>
        <label htmlFor="cp-current" className="label">현재 비밀번호</label>
        <input id="cp-current" name="currentPassword" type="password" required maxLength={72} autoComplete="current-password" className="input" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cp-new" className="label">새 비밀번호</label>
          <input id="cp-new" name="newPassword" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="input" />
        </div>
        <div>
          <label htmlFor="cp-new2" className="label">새 비밀번호 확인</label>
          <input id="cp-new2" name="newPasswordConfirm" type="password" required maxLength={72} autoComplete="new-password" className="input" />
        </div>
      </div>
      <FormMessage error={state?.error} message={state?.message} />
      <div className="flex justify-end">
        <SubmitButton variant="secondary">비밀번호 변경</SubmitButton>
      </div>
    </form>
  );
}
