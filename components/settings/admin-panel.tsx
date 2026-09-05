'use client';

import { useActionState, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { useToast } from '@/components/ui/toast';
import { changeSitePassword, changeUserRole } from '@/actions/settings';
import { Avatar } from '@/components/ui/avatar';
import { formatClassInfo, roleLabel } from '@/lib/utils/student-id';
import type { ActionResult } from '@/lib/utils/errors';

export function SitePasswordForm({
  target,
  description,
}: {
  target: 'notice' | 'calendar';
  description: string;
}) {
  const { notify } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await changeSitePassword(prev, formData);
      if (result.ok) {
        notify(result.message ?? '바꿨습니다.');
        formRef.current?.reset();
      }
      return result;
    },
    null as ActionResult | null,
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="target" value={target} />
      <p className="text-[13px] text-subtle">{description}</p>
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
        <Button type="submit" size="sm" loading={pending}>
          변경
        </Button>
      </div>
    </form>
  );
}

export type ManagedUser = {
  id: string;
  name: string;
  studentId: string;
  role: 'student' | 'teacher' | 'admin';
  grade: number | null;
  classNumber: number | null;
  studentNumber: number | null;
  avatarPath: string | null;
};

export function RoleManager({ people }: { people: ManagedUser[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [filter, setFilter] = useState('');

  const visible = filter
    ? people.filter((p) => p.name.includes(filter) || p.studentId.includes(filter))
    : people;

  async function submit(userId: string, role: string) {
    const formData = new FormData();
    formData.set('userId', userId);
    formData.set('role', role);
    const result = await changeUserRole(null, formData);
    notify(result.ok ? (result.message ?? '바꿨습니다.') : result.error, result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <Input
        label="이름 또는 학번으로 찾기"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="예) 홍길동 또는 20208"
      />

      <ul className="divide-y divide-line rounded-xl border border-line">
        {visible.length === 0 && (
          <li className="px-4 py-8 text-center text-[13px] text-subtle">해당하는 사람이 없습니다.</li>
        )}
        {visible.slice(0, 40).map((person) => (
          <li key={person.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={person.name} path={person.avatarPath} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">
                {person.name}
                <span className="ml-1.5 text-[11px] font-normal text-faint">{person.studentId}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-faint">
                {person.role === 'student'
                  ? formatClassInfo(person.grade, person.classNumber, person.studentNumber)
                  : roleLabel(person.role)}
              </p>
            </div>

            <Select
              aria-label={`${person.name} 역할`}
              defaultValue={person.role}
              onChange={(e) => submit(person.id, e.target.value)}
              className="h-9 w-28 py-0 text-[13px]"
            >
              <option value="student">학생</option>
              <option value="teacher">교사</option>
              <option value="admin">관리자</option>
            </Select>
          </li>
        ))}
      </ul>

      {visible.length > 40 && (
        <p className="text-[12px] text-faint">앞의 40명만 표시했습니다. 이름이나 학번으로 좁혀 주세요.</p>
      )}
    </div>
  );
}
