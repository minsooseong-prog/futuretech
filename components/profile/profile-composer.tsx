'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import { ImageUploader, type UploaderItem } from '@/components/ui/image-uploader';
import { useToast } from '@/components/ui/toast';
import {
  addProfileImages,
  createProfilePost,
  deleteProfileImage,
  deleteProfilePost,
} from '@/actions/profile';
import { formatRelative } from '@/lib/utils/date';
import { thumbUrl } from '@/lib/media';
import type { ActionResult } from '@/lib/utils/errors';

export type ProfileNote = { id: string; content: string; createdAt: string };
export type ProfilePhoto = { id: string; storagePath: string; thumbPath: string | null };

export function ProfileComposer() {
  const router = useRouter();
  const { notify } = useToast();

  const [state, formAction, pending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await createProfilePost(prev, formData);
      if (result.ok) {
        notify(result.message ?? '남겼습니다.');
        router.refresh();
      }
      return result;
    },
    null as ActionResult | null,
  );

  return (
    <form action={formAction} className="space-y-2.5" noValidate>
      <Textarea
        name="content"
        required
        rows={3}
        maxLength={500}
        placeholder="오늘 뭐 했나요?"
        aria-label="한 줄 남기기"
        className="min-h-[84px]"
      />
      {state && !state.ok && <FormMessage error={state.error} />}
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>
          남기기
        </Button>
      </div>
    </form>
  );
}

export function ProfileNotes({ notes, canManage }: { notes: ProfileNote[]; canManage: boolean }) {
  const router = useRouter();
  const { notify } = useToast();

  async function remove(id: string) {
    const result = await deleteProfilePost(id);
    notify(result.ok ? (result.message ?? '삭제했습니다.') : result.error, result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  if (notes.length === 0) {
    return <p className="px-5 py-8 text-center text-[13px] text-subtle">아직 남긴 글이 없습니다.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {notes.map((note) => (
        <li key={note.id} className="flex items-start gap-3 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">{note.content}</p>
            <time className="mt-1 block text-[11px] text-faint">{formatRelative(note.createdAt)}</time>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => remove(note.id)}
              aria-label="글 삭제"
              className="rounded-md p-1.5 text-faint transition hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ProfileGallery({
  photos,
  canManage,
}: {
  photos: ProfilePhoto[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [uploads, setUploads] = useState<UploaderItem[]>([]);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (uploads.length === 0) return;
    setSaving(true);
    const result = await addProfileImages(
      uploads.map((u) => ({ path: u.path, thumbPath: u.thumbPath })),
    );
    setSaving(false);
    notify(result.ok ? (result.message ?? '올렸습니다.') : result.error, result.ok ? 'success' : 'error');
    if (result.ok) {
      setUploads([]);
      router.refresh();
    }
  }

  async function remove(id: string) {
    const result = await deleteProfileImage(id);
    notify(result.ok ? (result.message ?? '지웠습니다.') : result.error, result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  return (
    <div className="p-5">
      {canManage && (
        <div className="mb-5">
          <ImageUploader
            folder="profile"
            max={10}
            withThumb
            value={uploads}
            onChange={setUploads}
            label="사진 추가"
          />
          {uploads.length > 0 && (
            <div className="mt-3 flex justify-end">
              <Button type="button" size="sm" onClick={save} loading={saving}>
                {uploads.length}장 저장
              </Button>
            </div>
          )}
        </div>
      )}

      {photos.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-subtle">아직 사진이 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="group relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl(photo.thumbPath, photo.storagePath) ?? ''}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full rounded-xl border border-line object-cover"
              />
              {canManage && (
                <button
                  type="button"
                  onClick={() => remove(photo.id)}
                  aria-label="사진 삭제"
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
