'use client';

import { useActionState, useRef, useState } from 'react';
import { deleteAccount } from '@/lib/actions/settings';
import { GRADUATION_PHRASE } from '@/lib/constants';
import { Modal } from '@/components/ui/Modal';
import { FormMessage } from '@/components/ui/FormMessage';

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteAccount, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [phrase, setPhrase] = useState('');
  const [confirming, setConfirming] = useState(false);

  const ready = password.length > 0 && password === passwordAgain && phrase === GRADUATION_PHRASE;

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="del-pw" className="label">현재 비밀번호</label>
            <input id="del-pw" name="password" type="password" required maxLength={72} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="del-pw2" className="label">비밀번호 다시 입력</label>
            <input id="del-pw2" name="passwordAgain" type="password" required maxLength={72} autoComplete="current-password" value={passwordAgain} onChange={(e) => setPasswordAgain(e.target.value)} className="input" />
            {passwordAgain.length > 0 && password !== passwordAgain && <p className="hint text-danger">두 비밀번호가 다릅니다.</p>}
          </div>
        </div>
        <div>
          <label htmlFor="del-phrase" className="label">
            확인 문구: <span className="font-semibold">{GRADUATION_PHRASE}</span>
          </label>
          <input id="del-phrase" name="phrase" required autoComplete="off" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder={GRADUATION_PHRASE} className="input" />
        </div>
        <FormMessage error={state?.error} />
        <div className="flex justify-end">
          <button type="button" className="btn-danger" disabled={!ready || pending} onClick={() => setConfirming(true)}>
            계정 삭제
          </button>
        </div>
      </form>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="정말 졸업하시겠습니까?"
        description="계정과 프로필 사진, 개인 갤러리, 개인 글이 삭제됩니다. 게시판 글·댓글·앨범은 작성자가 '졸업생'으로 표시된 채 남고, 이름은 졸업생 목록에 기록됩니다. 되돌릴 수 없습니다."
      >
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
            취소
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={pending}
            onClick={() => {
              setConfirming(false);
              formRef.current?.requestSubmit();
            }}
          >
            졸업하기
          </button>
        </div>
      </Modal>
    </>
  );
}
