'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { ImageUploader, type UploaderItem } from '@/components/ui/image-uploader';
import { useToast } from '@/components/ui/toast';
import type { ActionResult } from '@/lib/utils/errors';

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult<{ id: string }>>;

export function AlbumForm({
  action,
  initial,
  submitLabel = '앨범 올리기',
  withPhotos = true,
}: {
  action: Action;
  initial?: { title: string; description: string };
  submitLabel?: string;
  withPhotos?: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [images, setImages] = useState<UploaderItem[]>([]);

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      formData.set(
        'images',
        JSON.stringify(images.map((i) => ({ path: i.path, thumbPath: i.thumbPath }))),
      );
      const result = await action(prev, formData);
      if (result.ok) {
        notify(result.message ?? '저장했습니다.');
        router.push(`/album/${result.data?.id ?? ''}`);
        router.refresh();
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Input
        label="제목"
        name="title"
        required
        maxLength={120}
        defaultValue={initial?.title}
        placeholder="예) 체육대회 날"
        error={fieldErrors?.title}
      />

      <Textarea
        label="설명 (선택)"
        name="description"
        rows={4}
        maxLength={2000}
        defaultValue={initial?.description}
        placeholder="언제, 어디서 찍은 사진인가요?"
        error={fieldErrors?.description}
      />

      {withPhotos && (
        <div>
          <span className="label">사진</span>
          <ImageUploader folder="album" max={10} withThumb value={images} onChange={setImages} />
          {fieldErrors?.images && (
            <p role="alert" className="mt-1.5 text-xs text-danger">
              {fieldErrors.images}
            </p>
          )}
        </div>
      )}

      {state && !state.ok && !fieldErrors && <FormMessage error={state.error} />}

      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={pending}>
          취소
        </Button>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
