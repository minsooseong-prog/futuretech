'use client';

import { useActionState, useState } from 'react';
import { registerAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { parseStudentId } from '@/lib/utils/student-id';
import type { ActionResult } from '@/lib/utils/errors';

const initialState = null as ActionResult | null;

export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [studentId, setStudentId] = useState('');
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  const parsed = parseStudentId(studentId);

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
        value={studentId}
        onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 5))}
        error={fieldErrors?.studentId}
        hint={
          parsed
            ? `${parsed.grade}학년 ${parsed.classNumber}반 ${parsed.studentNumber}번으로 등록됩니다.`
            : '학년 1자리, 반 2자리, 번호 2자리 — 예) 20208'
        }
      />
      <Input
        label="비밀번호"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={5}
        error={fieldErrors?.password}
      />
      <Input
        label="비밀번호 확인"
        name="passwordConfirm"
        type="password"
        autoComplete="new-password"
        required
        error={fieldErrors?.passwordConfirm}
      />

      {state && !state.ok && !fieldErrors && <FormMessage error={state.error} />}

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        회원가입
      </Button>

      <p className="pt-1 text-center text-[13px] text-subtle">
        이미 계정이 있나요?{' '}
        <button type="button" onClick={onSwitch} className="font-medium text-ink underline underline-offset-4">
          로그인
        </button>
      </p>
    </form>
  );
}
