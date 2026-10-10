'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { FormMessage } from '@/components/ui/FormMessage';
import { uploadImages } from '@/components/upload/upload-images';
import { updateAvatar } from '@/lib/actions/profile';
import { IMAGE_SIZES } from '@/lib/constants';

export function AvatarForm({ name, currentUrl, hasAvatar }: { name: string; currentUrl: string | null; hasAvatar: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function run(task: () => Promise<{ error?: string; message?: string } | undefined>) {
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    start(async () => {
      try {
        const res = await task();
        if (res?.error) setError(res.error);
        else {
          setMessage(res?.message);
          setFile(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '저장하지 못했습니다.');
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <section className="card p-5 md:p-6" aria-labelledby="avatar-title">
      <h2 id="avatar-title" className="section-title mb-4">프로필 사진</h2>
      <div className="flex flex-wrap items-center gap-5">
        <Avatar src={preview ?? currentUrl} name={name} size={88} />
        <div className="space-y-2">
          <label className="btn-secondary cursor-pointer">
            <Camera className="h-4 w-4" aria-hidden="true" />
            사진 선택
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f && f.type.startsWith('image/')) setFile(f);
              }}
            />
          </label>
          <p className="text-xs text-muted">정사각형에 가까운 사진이 잘 어울립니다.</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <FormMessage error={error} message={message} />
        <div className="flex flex-wrap gap-2">
          {file && (
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  const [path] = await uploadImages([file], 'avatars', { maxSize: IMAGE_SIZES.avatar, thumb: false, quality: 0.85 });
                  return updateAvatar(path);
                })
              }
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              이 사진으로 변경
            </button>
          )}
          {file && (
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => setFile(null)}>
              취소
            </button>
          )}
          {!file && hasAvatar && (
            <button type="button" className="btn-ghost text-danger" disabled={busy} onClick={() => run(() => updateAvatar(null))}>
              사진 삭제
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
