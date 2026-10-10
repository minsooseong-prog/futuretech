'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type GalleryImage = { id: string; thumb: string | null; full: string | null };

type Props = { images: GalleryImage[]; alt: string; layout?: 'masonry' | 'grid' };

export function Gallery({ images, alt, layout = 'masonry' }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, step]);

  const current = index !== null ? images[index] : null;

  return (
    <>
      <ul className={cn(layout === 'masonry' ? 'columns-2 gap-2 sm:columns-3 [&>li]:mb-2' : 'grid grid-cols-2 gap-2 sm:grid-cols-3')}>
        {images.map((img, i) => (
          <li key={img.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'block w-full overflow-hidden rounded-lg border border-line bg-subtle',
                layout === 'grid' && 'aspect-square',
              )}
              aria-label={`${alt} 사진 ${i + 1} 크게 보기`}
            >
              {img.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.thumb}
                  alt={`${alt} 사진 ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className={cn('w-full transition-transform duration-300 hover:scale-[1.02]', layout === 'grid' ? 'h-full object-cover' : 'h-auto')}
                />
              ) : (
                <span className="flex aspect-square items-center justify-center text-xs text-muted">이미지를 불러올 수 없음</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={close}
        aria-label="사진 크게 보기"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
      >
        {current && index !== null && (
          <div className="relative flex h-full w-full items-center justify-center" onClick={(e) => e.target === e.currentTarget && close()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.full ?? current.thumb ?? ''}
              alt={`${alt} 사진 ${index + 1}`}
              className="max-h-[88dvh] max-w-[94vw] animate-fade-in object-contain"
            />
            <p className="absolute left-1/2 top-4 -translate-x-1/2 text-sm text-white/70" aria-live="polite">
              {index + 1} / {images.length}
            </p>
            <button type="button" onClick={close} className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="닫기">
              <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/10" aria-label="이전 사진">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button type="button" onClick={() => step(1)} className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/10" aria-label="다음 사진">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
