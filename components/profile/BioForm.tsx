'use client';

import { useActionState, useState } from 'react';
import { updateBio } from '@/lib/actions/profile';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function BioForm({ bio }: { bio: string }) {
  const [state, formAction] = useActionState(updateBio, undefined);
  const [length, setLength] = useState(bio.length);

  return (
    <form action={formAction} className="card space-y-3 p-5 md:p-6">
      <label htmlFor="bio" className="section-title block">한 줄 소개</label>
      <textarea
        id="bio"
        name="bio"
        maxLength={160}
        rows={3}
        defaultValue={bio}
        onChange={(e) => setLength(e.target.value.length)}
        placeholder="미래를 만드는 중."
        className="textarea min-h-[5rem]"
        aria-describedby="bio-count"
      />
      <p id="bio-count" className="text-right text-xs tabular-nums text-muted">{length} / 160</p>
      <FormMessage error={state?.error} message={state?.message} />
      <div className="flex justify-end">
        <SubmitButton>저장</SubmitButton>
      </div>
    </form>
  );
}
