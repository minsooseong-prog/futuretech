'use client';

import { useRef, useState, useTransition } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';
import type { ActionState } from '@/lib/actions/types';

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  needsPassword: boolean;
  canPin: boolean;
  initial?: { title: string; content: string; pinned: boolean };
  submitLabel: string;
};

/**
 * 비밀번호가 필요한 경우 모달로 입력받아 폼 데이터와 함께 서버로 보냅니다.
 * 검증은 서버에서만 하며, 브라우저에는 비밀번호나 해시가 전달되지 않습니다.
 */
export function NoticeForm({ action, needsPassword, canPin, initial, submitLabel }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [askPassword, setAskPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [modalError, setModalError] = useState<string>();
  const [pending, start] = useTransition();

  function submit(gatePassword?: string) {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    if (gatePassword !== undefined) fd.set('gatePassword', gatePassword);
    start(async () => {
      const res = await action(undefined, fd);
      if (res?.error) {
        if (askPassword) setModalError(res.error);
        else setError(res.error);
      }
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    if (!e.currentTarget.reportValidity()) return;
    if (needsPassword) {
      setModalError(undefined);
      setPassword('');
      setAskPassword(true);
    } else {
      submit();
    }
  }

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} className="card space-y-5 p-5 md:p-6">
        <div>
          <label htmlFor="nt-title" className="label">제목</label>
          <input id="nt-title" name="title" required maxLength={100} defaultValue={initial?.title} className="input" />
        </div>
        <div>
          <label htmlFor="nt-content" className="label">내용</label>
          <textarea id="nt-content" name="content" required maxLength={10000} rows={12} defaultValue={initial?.content} className="textarea" />
        </div>
        {canPin && (
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="pinned" defaultChecked={initial?.pinned} className="h-4 w-4 accent-current" />
            상단에 고정
          </label>
        )}
        <FormMessage error={error} />
        <div className="flex items-center justify-end gap-3">
          {needsPassword && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              등록할 때 공지 비밀번호를 확인합니다
            </span>
          )}
          <SubmitButton pending={pending && !askPassword}>{submitLabel}</SubmitButton>
        </div>
      </form>

      <Modal
        open={askPassword}
        onClose={() => setAskPassword(false)}
        title="공지 비밀번호"
        description="선생님께 받은 공지 작성 비밀번호를 입력하세요."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setModalError(undefined);
            submit(password);
          }}
          className="space-y-4"
        >
          <label htmlFor="gate-pw" className="sr-only">공지 비밀번호</label>
          <input
            id="gate-pw"
            type="password"
            autoComplete="off"
            autoFocus
            required
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <FormMessage error={modalError} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAskPassword(false)}>
              취소
            </button>
            <button type="submit" className="btn-primary" disabled={pending || password.length === 0}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              확인 후 등록
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
