'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadImage, type UploadedImage } from '@/lib/utils/image';
import { discardUpload } from '@/actions/uploads';
import { cn } from '@/lib/utils/cn';

export type UploaderItem = UploadedImage;

/**
 * Picks, compresses, uploads and previews images. Uploading happens as soon as
 * a file is chosen so that submitting the surrounding form is instant.
 */
export function ImageUploader({
  folder,
  max = 10,
  withThumb = false,
  value,
  onChange,
  label = '사진 추가',
  className,
}: {
  folder: 'album' | 'posts' | 'profile';
  max?: number;
  withThumb?: boolean;
  value: UploaderItem[];
  onChange: (next: UploaderItem[]) => void;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = max - value.length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const picked = Array.from(files).slice(0, Math.max(remaining, 0));
    if (picked.length === 0) {
      setError(`사진은 ${max}장까지 올릴 수 있습니다.`);
      return;
    }

    setBusy(true);
    const uploaded: UploaderItem[] = [];
    try {
      for (const file of picked) {
        uploaded.push(await uploadImage(file, folder, { withThumb }));
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(index: number) {
    const removed = value[index];
    onChange(value.filter((_, i) => i !== index));

    // The file is already in storage, so take it back out rather than leaving
    // an orphan behind. Failure here is not worth interrupting the person for.
    if (removed) {
      void discardUpload(removed.path);
      if (removed.thumbPath) void discardUpload(removed.thumbPath);
      URL.revokeObjectURL(removed.previewUrl);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2.5">
        {value.map((item, index) => (
          <figure
            key={item.path}
            className="relative h-24 w-24 overflow-hidden rounded-xl border border-line bg-canvas"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`${index + 1}번째 사진 빼기`}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </figure>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              'flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line',
              'text-[11px] text-subtle transition hover:border-ink hover:text-ink disabled:opacity-60',
            )}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="h-4 w-4" aria-hidden />
            )}
            {busy ? '올리는 중' : label}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="mt-2 text-xs text-faint">
        {value.length}/{max}장 · 올리기 전에 자동으로 크기를 줄이고 WebP로 바꿉니다.
      </p>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
