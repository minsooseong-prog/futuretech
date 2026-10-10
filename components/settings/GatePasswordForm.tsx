'use client';

import { useActionState, useEffect, useRef } from 'react';
import { updateGatePassword } from '@/lib/actions/settings';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function GatePasswordForm({ kind, title }: { kind: 'notice' | 'calendar'; title: string }) {
  const [state, formAction] = useActionState(updateGatePassword.bind(null, kind), undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${kind}-new`} className="label">새 비밀번호</label>
          <input id={`${kind}-new`} name="newPassword" type="password" required minLength={4} maxLength={72} autoComplete="new-password" className="input" />
        </div>
        <div>
          <label htmlFor={`${kind}-new2`} className="label">새 비밀번호 확인</label>
          <input id={`${kind}-new2`} name="newPasswordConfirm" type="password" required maxLength={72} autoComplete="new-password" className="input" />
        </div>
      </div>
      <FormMessage error={state?.error} message={state?.message} />
      <div className="flex justify-end">
        <SubmitButton variant="secondary">변경</SubmitButton>
      </div>
    </form>
  );
}
