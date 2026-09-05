'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { useToast } from '@/components/ui/toast';
import { updateProfile } from '@/actions/profile';
import type { ActionResult } from '@/lib/utils/errors';

export function ProfileEditForm({ bio }: { bio: string }) {
  const router = useRouter();
  const { notify } = useToast();

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await updateProfile(prev, formData);
      if (result.ok) {
        notify(result.message ?? '저장했습니다.');
        router.refresh();
      }
      return result;
    },
    null as ActionResult | null,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <Textarea
        label="한 줄 소개"
        name="bio"
        rows={3}
        maxLength={200}
        defaultValue={bio}
        placeholder="미래를 만드는 중."
        hint="200자까지 쓸 수 있습니다."
      />
      {state && !state.ok && <FormMessage error={state.error} />}
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          저장
        </Button>
      </div>
    </form>
  );
}
