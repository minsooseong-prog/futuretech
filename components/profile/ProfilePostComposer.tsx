'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createProfilePost } from '@/lib/actions/profile';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function ProfilePostComposer() {
  const [state, formAction] = useActionState(createProfilePost, undefined);
  const [length, setLength] = useState(0);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setLength(0);
    }
  }, [state]);

  return (
    <form ref={ref} action={formAction} className="card mb-4 p-4">
      <label htmlFor="pp-content" className="sr-only">짧은 글 쓰기</label>
      <textarea
        id="pp-content"
        name="content"
        required
        maxLength={500}
        rows={3}
        onChange={(e) => setLength(e.target.value.length)}
        placeholder="오늘은 어떤 걸 만들었나요?"
        className="w-full resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted/70 focus:outline-none"
      />
      <FormMessage error={state?.error} />
      <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
        <span className="text-xs tabular-nums text-muted">{length} / 500</span>
        <SubmitButton className="btn-sm h-8">남기기</SubmitButton>
      </div>
    </form>
  );
}
