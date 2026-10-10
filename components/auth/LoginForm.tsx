'use client';

import { useActionState } from 'react';
import { loginAction } from '@/lib/actions/auth';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-name" className="label">이름</label>
        <input id="login-name" name="name" autoComplete="name" required maxLength={20} className="input" placeholder="홍길동" />
      </div>
      <div>
        <label htmlFor="login-sid" className="label">학번</label>
        <input
          id="login-sid"
          name="studentId"
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          required
          autoComplete="username"
          className="input tracking-[0.2em]"
          placeholder="20208"
        />
      </div>
      <div>
        <label htmlFor="login-pw" className="label">비밀번호</label>
        <input id="login-pw" name="password" type="password" required autoComplete="current-password" maxLength={72} className="input" />
      </div>
      <FormMessage error={state?.error} />
      <SubmitButton className="mt-2 w-full">로그인</SubmitButton>
    </form>
  );
}
