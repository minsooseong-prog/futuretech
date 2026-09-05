'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { removeAvatar, updateAvatar } from '@/actions/profile';
import { processImage, uploadImage } from '@/lib/utils/image';

export function AvatarEditor({
  name,
  currentPath,
}: {
  name: string;
  currentPath: string | null;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function pick(files: FileList | null) {
    const chosen = files?.[0];
    if (!chosen) return;
    try {
      // Show the compressed result, not the original — what you see is what uploads.
      const processed = await processImage(chosen, { maxSize: 512, quality: 0.85 });
      setFile(chosen);
      setPreview(processed.previewUrl);
      setOpen(true);
    } catch (err) {
      notify(err instanceof Error ? err.message : '이미지를 읽지 못했습니다.', 'error');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function save() {
    if (!file) return;
    setBusy(true);
    try {
      const uploaded = await uploadImage(file, 'avatars', { maxSize: 512, quality: 0.85 });
      const result = await updateAvatar(uploaded.path);
      if (!result.ok) {
        notify(result.error, 'error');
        return;
      }
      notify(result.message ?? '프로필 사진을 바꿨습니다.');
      setOpen(false);
      setFile(null);
      router.refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : '업로드에 실패했습니다.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    startTransition(async () => {
      const result = await removeAvatar();
      notify(result.ok ? (result.message ?? '지웠습니다.') : result.error, result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      <div className="relative">
        <Avatar name={name} path={currentPath} size="xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="프로필 사진 바꾸기"
          className="absolute -bottom-1 -right-1 rounded-full border border-line bg-surface p-2 shadow-card transition hover:bg-canvas"
        >
          <Camera className="h-3.5 w-3.5" aria-hidden />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => pick(e.target.files)}
        />
      </div>

      {currentPath && (
        <button
          type="button"
          onClick={clear}
          disabled={pending}
          className="mt-2 text-[12px] text-faint underline underline-offset-4 transition hover:text-danger"
        >
          {pending ? '지우는 중…' : '사진 지우기'}
        </button>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="이 사진으로 바꿀까요?"
        description="올리기 전에 미리 보기입니다."
      >
        <div className="flex flex-col items-center gap-5">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="새 프로필 사진 미리보기"
              className="h-40 w-40 rounded-full border border-line object-cover"
            />
          )}
          <div className="flex w-full justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              취소
            </Button>
            <Button onClick={save} loading={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  올리는 중
                </>
              ) : (
                '저장'
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
