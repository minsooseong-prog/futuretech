'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { ImageUploader, type UploaderItem } from '@/components/ui/image-uploader';
import { useToast } from '@/components/ui/toast';
import { BOARD_CATEGORIES } from '@/lib/validation/schemas';
import type { ActionResult } from '@/lib/utils/errors';

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult<{ id: string }>>;

export function PostForm({
  action,
  initial,
  submitLabel = '올리기',
}: {
  action: Action;
  initial?: { category: string; title: string; content: string };
  submitLabel?: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [images, setImages] = useState<UploaderItem[]>([]);

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      formData.set('imagePaths', JSON.stringify(images.map((i) => i.path)));
      const result = await action(prev, formData);
      if (result.ok) {
        notify(result.message ?? '저장했습니다.');
        router.push(`/board/${result.data?.id ?? ''}`);
        router.refresh();
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Select label="말머리" name="category" defaultValue={initial?.category ?? '자유'} error={fieldErrors?.category}>
        {BOARD_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </Select>

      <Input
        label="제목"
        name="title"
        required
        maxLength={120}
        defaultValue={initial?.title}
        placeholder="무슨 이야기인가요?"
        error={fieldErrors?.title}
      />

      <Textarea
        label="내용"
        name="content"
        required
        rows={12}
        defaultValue={initial?.content}
        placeholder="자유롭게 적어 주세요."
        error={fieldErrors?.content}
        className="min-h-[260px]"
      />

      {!initial && (
        <div>
          <span className="label">사진 (선택)</span>
          <ImageUploader folder="posts" max={10} value={images} onChange={setImages} />
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
