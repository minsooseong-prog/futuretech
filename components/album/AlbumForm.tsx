'use client';

import { useState, useTransition } from 'react';
import { ImagePicker, type ExistingImage } from '@/components/upload/ImagePicker';
import { uploadImages } from '@/components/upload/upload-images';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { LIMITS } from '@/lib/constants';
import type { ActionState } from '@/lib/actions/types';

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  initial?: { title: string; description: string };
  existingImages?: ExistingImage[];
  submitLabel: string;
};

export function AlbumForm({ action, initial, existingImages = [], submitLabel }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [stage, setStage] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [, startTransition] = useTransition();
  const busy = stage !== 'idle';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const kept = existingImages.filter((i) => !removedIds.includes(i.id)).length;
    if (kept + files.length === 0) {
      setError('사진을 한 장 이상 추가해주세요.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    try {
      setStage('uploading');
      const paths = await uploadImages(files, 'album');
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
      <div>
        <label htmlFor="al-title" className="label">제목</label>
        <input id="al-title" name="title" required maxLength={60} defaultValue={initial?.title} className="input" disabled={busy} placeholder="예: 로봇 동아리 첫 시연" />
      </div>
      <div>
        <label htmlFor="al-desc" className="label">설명</label>
        <textarea id="al-desc" name="description" maxLength={1000} rows={4} defaultValue={initial?.description} className="textarea min-h-[6rem]" disabled={busy} />
      </div>
      <ImagePicker
        max={LIMITS.albumImages}
        files={files}
        onFilesChange={setFiles}
        existing={existingImages}
        removedIds={removedIds}
        onRemovedChange={setRemovedIds}
        disabled={busy}
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
