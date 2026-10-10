'use client';

import { useState, useTransition } from 'react';
import { ImagePicker } from '@/components/upload/ImagePicker';
import { discardAfterFailure, uploadImages } from '@/components/upload/upload-images';
import { FormMessage } from '@/components/ui/FormMessage';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { addProfileImages } from '@/lib/actions/profile';
import { LIMITS } from '@/lib/constants';

export function ProfilePhotoUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    setBusy(true);
    setError(undefined);
    try {
      const paths = await uploadImages(files, 'profile');
      start(async () => {
        const res = await addProfileImages(paths);
        if (res?.error) {
          setError(res.error);
          await discardAfterFailure('profile', paths);
        } else {
          setFiles([]);
        }
        setBusy(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드하지 못했습니다.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mb-4 space-y-3 p-4">
      <ImagePicker max={LIMITS.profileImagesPerUpload} files={files} onFilesChange={setFiles} disabled={busy} label="사진 추가" />
      <FormMessage error={error} />
      {files.length > 0 && (
        <div className="flex justify-end">
          <SubmitButton pending={busy} className="btn-sm h-8">
            {files.length}장 올리기
          </SubmitButton>
        </div>
      )}
    </form>
  );
}
