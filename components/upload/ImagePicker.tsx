'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ImagePlus, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ExistingImage = { id: string; url: string | null };

type Props = {
  max: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  existing?: ExistingImage[];
  removedIds?: string[];
  onRemovedChange?: (ids: string[]) => void;
  disabled?: boolean;
  label?: string;
};

const MAX_ORIGINAL = 30 * 1024 * 1024; // 원본 30MB까지 허용 (업로드 전 압축됨)

export function ImagePicker({
  max,
  files,
  onFilesChange,
  existing = [],
  removedIds = [],
  onRemovedChange,
  disabled,
  label = '사진',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [warning, setWarning] = useState<string>();

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const keptExisting = existing.filter((e) => !removedIds.includes(e.id)).length;
  const total = keptExisting + files.length;
  const remaining = Math.max(0, max - total);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    const images = picked.filter((f) => f.type.startsWith('image/'));
    const sized = images.filter((f) => f.size <= MAX_ORIGINAL);
    const accepted = sized.slice(0, remaining);
    if (images.length !== picked.length) setWarning('이미지 파일만 선택할 수 있습니다.');
    else if (sized.length !== images.length) setWarning('30MB를 넘는 사진은 제외했습니다.');
    else if (accepted.length < sized.length) setWarning(`사진은 최대 ${max}장까지 올릴 수 있습니다.`);
    else setWarning(undefined);
    if (accepted.length) onFilesChange([...files, ...accepted]);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <span className="text-xs text-muted" aria-live="polite">
          {total} / {max}
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {existing.map((img) => {
          const removed = removedIds.includes(img.id);
          return (
            <li key={img.id} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-subtle">
              {img.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="" className={cn('h-full w-full object-cover transition-opacity', removed && 'opacity-25')} />
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onRemovedChange?.(removed ? removedIds.filter((id) => id !== img.id) : [...removedIds, img.id])
                }
                className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label={removed ? '삭제 취소' : '기존 사진 삭제'}
              >
                {removed ? <RotateCcw className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              </button>
            </li>
          );
        })}
        {previews.map((src, i) => (
          <li key={src} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`선택한 사진 ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label={`선택한 사진 ${i + 1} 제거`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {remaining > 0 && (
          <li>
            <label
              htmlFor={inputId}
              className={cn(
                'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-muted transition-colors hover:border-ink/40 hover:text-ink',
                disabled && 'pointer-events-none opacity-50',
              )}
            >
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs">추가</span>
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/*"
              multiple={max > 1}
              disabled={disabled}
              onChange={onPick}
              className="sr-only"
            />
          </li>
        )}
      </ul>
      {warning && <p className="hint text-danger" role="alert">{warning}</p>}
      <p className="hint">큰 사진은 업로드 전에 자동으로 줄이고 WebP로 변환합니다. 위치 정보는 저장되지 않습니다.</p>
    </div>
  );
}
