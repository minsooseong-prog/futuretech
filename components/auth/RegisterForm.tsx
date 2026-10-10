'use client';

import { useActionState, useState } from 'react';
import { registerAction } from '@/lib/actions/auth';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';

function preview(sid: string) {
  if (!/^\d{5}$/.test(sid)) return null;
  const g = Number(sid[0]);
  const c = Number(sid.slice(1, 3));
  const n = Number(sid.slice(3, 5));
  if (g < 1 || g > 3 || c < 1 || n < 1) return { ok: false, text: '학년은 1~3, 반과 번호는 01 이상이어야 합니다.' };
  return { ok: true, text: `${g}학년 ${c}반 ${n}번으로 등록됩니다.` };
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, undefined);
  const [sid, setSid] = useState('');
  const info = preview(sid);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="reg-name" className="label">이름</label>
        <input id="reg-name" name="name" autoComplete="name" required maxLength={20} className="input" placeholder="홍길동" />
      </div>
      <div>
        <label htmlFor="reg-sid" className="label">학번</label>
        <input
          id="reg-sid"
          name="studentId"
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          required
          autoComplete="username"
          value={sid}
          onChange={(e) => setSid(e.target.value.replace(/\D/g, '').slice(0, 5))}
          aria-describedby="reg-sid-hint"
          className="input tracking-[0.2em]"
          placeholder="20208"
        />
        <p id="reg-sid-hint" className={info && !info.ok ? 'hint text-danger' : 'hint'} aria-live="polite">
          {info ? info.text : '학년 1자리 + 반 2자리 + 번호 2자리'}
        </p>
      </div>
      <div>
        <label htmlFor="reg-pw" className="label">비밀번호</label>
        <input id="reg-pw" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className="input" aria-describedby="reg-pw-hint" />
        <p id="reg-pw-hint" className="hint">8자 이상</p>
      </div>
      <div>
        <label htmlFor="reg-pw2" className="label">비밀번호 확인</label>
        <input id="reg-pw2" name="passwordConfirm" type="password" required maxLength={72} autoComplete="new-password" className="input" />
      </div>
      <FormMessage error={state?.error} />
      <SubmitButton className="mt-2 w-full">가입하기</SubmitButton>
    </form>
  );
}
