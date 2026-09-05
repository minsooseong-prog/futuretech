'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { mediaUrl, thumbUrl } from '@/lib/media';

export type GalleryImage = { storagePath: string; thumbPath: string | null };

/**
 * Grid + lightbox. Thumbnails carry the grid; the full-size file is only
 * requested when someone actually opens a photo.
 */
export function PhotoGrid({ images, title }: { images: GalleryImage[]; title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? null : (current + delta + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    }
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [openIndex, close, step]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li key={image.storagePath}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`${title} ${index + 1}번째 사진 크게 보기`}
              className="group block aspect-square w-full overflow-hidden rounded-xl border border-line bg-canvas"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(image.thumbPath, image.storagePath) ?? ''}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} 사진 보기`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={close}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(images[openIndex].storagePath) ?? ''}
              alt={`${title} ${openIndex + 1}번째 사진`}
              className="max-h-[88vh] max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              type="button"
              onClick={close}
              aria-label="닫기"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  aria-label="이전 사진"
                  className="absolute left-3 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  aria-label="다음 사진"
                  className="absolute right-3 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
                <p className="absolute bottom-5 rounded-full bg-white/10 px-3 py-1 text-[13px] tabular-nums text-white">
                  {openIndex + 1} / {images.length}
                </p>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
