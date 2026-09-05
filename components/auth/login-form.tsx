'use client';

import { useActionState } from 'react';
import { loginAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import type { ActionResult } from '@/lib/utils/errors';

const initialState = null as ActionResult | null;

export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Input
        label="이름"
        name="name"
        autoComplete="name"
        required
        maxLength={20}
        placeholder="홍길동"
        error={fieldErrors?.name}
      />
      <Input
        label="학번"
        name="studentId"
        inputMode="numeric"
        pattern="\d{5}"
        maxLength={5}
        required
        placeholder="20208"
        error={fieldErrors?.studentId}
      />
      <Input
        label="비밀번호"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={fieldErrors?.password}
      />

      {state && !state.ok && !fieldErrors && <FormMessage error={state.error} />}

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        로그인
      </Button>

      <p className="pt-1 text-center text-[13px] text-subtle">
        아직 계정이 없나요?{' '}
        <button type="button" onClick={onSwitch} className="font-medium text-ink underline underline-offset-4">
          회원가입
        </button>
      </p>
    </form>
  );
}
