'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { deleteAccount } from '@/actions/account';
import { GRADUATION_PHRASE } from '@/lib/validation/schemas';
import type { ActionResult } from '@/lib/utils/errors';

/**
 * Three confirmations, all re-verified on the server: the password, the
 * password again, and the phrase typed exactly. The button stays disabled until
 * all three are filled in, and a final dialog asks once more.
 */
export function DeleteAccountForm() {
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [phrase, setPhrase] = useState('');
  const [confirming, setConfirming] = useState(false);

  const [state, formAction, pending] = useActionState(
    deleteAccount,
    null as ActionResult | null,
  );

  const ready =
    password.length > 0 && password === passwordAgain && phrase.trim() === GRADUATION_PHRASE;

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form id="graduate-form" action={formAction} className="space-y-4" noValidate>
      <Input
        label="현재 비밀번호"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors?.password}
      />
      <Input
        label="비밀번호 다시 입력"
        name="passwordAgain"
        type="password"
        autoComplete="current-password"
        value={passwordAgain}
        onChange={(e) => setPasswordAgain(e.target.value)}
        error={fieldErrors?.passwordAgain}
      />
      <Input
        label="확인 문구"
        name="phrase"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        placeholder={GRADUATION_PHRASE}
        hint={`"${GRADUATION_PHRASE}" 를 그대로 입력하세요.`}
        error={fieldErrors?.phrase}
      />

      {state && !state.ok && !fieldErrors && <FormMessage error={state.error} />}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="danger"
          disabled={!ready || pending}
          onClick={() => setConfirming(true)}
        >
          졸업하고 계정 삭제
        </Button>
      </div>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="정말 졸업하시겠어요?"
        description="계정과 함께 올린 글, 사진, 댓글이 모두 지워집니다. 졸업생 목록에는 이름만 남습니다. 되돌릴 수 없습니다."
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => setConfirming(false)} disabled={pending}>
            취소
          </Button>
          {/* The dialog renders in a portal, so it targets the form by id. */}
          <Button variant="danger" type="submit" form="graduate-form" loading={pending}>
            삭제합니다
          </Button>
        </div>
      </Dialog>
    </form>
  );
}
