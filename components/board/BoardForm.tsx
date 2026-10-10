'use client';

import { useState, useTransition } from 'react';
import { ImagePicker, type ExistingImage } from '@/components/upload/ImagePicker';
import { uploadImages } from '@/components/upload/upload-images';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { BOARD_CATEGORIES, LIMITS } from '@/lib/constants';
import type { ActionState } from '@/lib/actions/types';

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: { category: string; title: string; content: string };
  existingImages?: ExistingImage[];
  submitLabel: string;
};

export function BoardForm({ action, initial, existingImages = [], submitLabel }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [stage, setStage] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [, startTransition] = useTransition();
  const busy = stage !== 'idle';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const fd = new FormData(e.currentTarget);
    try {
      setStage('uploading');
      const paths = await uploadImages(files, 'board');
      paths.forEach((p) => fd.append('imagePaths', p));
      removedIds.forEach((id) => fd.append('removeImageIds', id));
      setStage('saving');
      startTransition(async () => {
        const res = await action(undefined, fd);
        if (res?.error) {
          setError(res.error);
          setStage('idle');
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했습니다.');
      setStage('idle');
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-5 md:p-6">
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div>
          <label htmlFor="bp-category" className="label">말머리</label>
          <select id="bp-category" name="category" defaultValue={initial?.category ?? 'free'} className="input" disabled={busy}>
            {BOARD_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bp-title" className="label">제목</label>
          <input id="bp-title" name="title" required maxLength={100} defaultValue={initial?.title} className="input" disabled={busy} />
        </div>
      </div>
      <div>
        <label htmlFor="bp-content" className="label">내용</label>
        <textarea id="bp-content" name="content" required maxLength={10000} rows={12} defaultValue={initial?.content} className="textarea" disabled={busy} />
      </div>
      <ImagePicker
        max={LIMITS.boardImages}
        files={files}
        onFilesChange={setFiles}
        existing={existingImages}
        removedIds={removedIds}
        onRemovedChange={setRemovedIds}
        disabled={busy}
        label="첨부 사진"
      />
      <FormMessage error={error} />
      <div className="flex justify-end">
        <SubmitButton pending={busy}>
          {stage === 'uploading' ? '사진 올리는 중' : stage === 'saving' ? '저장 중' : submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
