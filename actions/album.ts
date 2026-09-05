'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { albumImages, albumPosts } from '@/lib/db/schema';
import { canManage, requireUserOrThrow } from '@/lib/auth/guard';
import { removeObjects } from '@/lib/supabase/server';
import { albumPostSchema } from '@/lib/validation/schemas';
import { ownsUploadPath } from '@/lib/uploads';
import { fail, succeed, toActionError, zodToFieldErrors, type ActionResult } from '@/lib/utils/errors';

type ImagePayload = { path: string; thumbPath: string | null };

function parseImages(raw: FormDataEntryValue | null): ImagePayload[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter((v) => v && typeof v.path === 'string')
      .slice(0, 10)
      .map((v) => ({ path: v.path as string, thumbPath: (v.thumbPath as string) ?? null }));
  } catch {
    return [];
  }
}

function allPaths(images: ImagePayload[]): string[] {
  return images.flatMap((i) => [i.path, i.thumbPath].filter(Boolean) as string[]);
}

export async function createAlbumPost(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const images = parseImages(formData.get('images'));

  try {
    const user = await requireUserOrThrow();

    const parsed = albumPostSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      images,
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    for (const image of parsed.data.images) {
      const ok =
        ownsUploadPath(user.id, image.path) &&
        (!image.thumbPath || ownsUploadPath(user.id, image.thumbPath));
      if (!ok) return fail('잘못된 이미지 경로입니다.');
    }

    const [album] = await db
      .insert(albumPosts)
      .values({
        authorId: user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
      })
      .returning({ id: albumPosts.id });

    try {
      await db.insert(albumImages).values(
        parsed.data.images.map((image, index) => ({
          albumPostId: album.id,
          storagePath: image.path,
          thumbPath: image.thumbPath ?? null,
          sortOrder: index,
        })),
      );
    } catch (err) {
      // Roll back the parent so no album can exist without its photos.
      await db.delete(albumPosts).where(eq(albumPosts.id, album.id));
      throw err;
    }

    revalidatePath('/album');
    revalidatePath('/home');
    return succeed({ id: album.id }, '앨범을 올렸습니다.');
  } catch (err) {
    await removeObjects(allPaths(images));
    return toActionError(err);
  }
}

export async function updateAlbumPost(
  albumId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ authorId: albumPosts.authorId })
      .from(albumPosts)
      .where(eq(albumPosts.id, albumId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('앨범을 찾을 수 없습니다.');
    if (!canManage(user, existing.authorId)) return fail('내가 올린 앨범만 수정할 수 있습니다.');

    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();

    if (title.length < 2) return fail('제목은 2자 이상이어야 합니다.', { title: '제목이 너무 짧습니다.' });

    await db
      .update(albumPosts)
      .set({ title, description: description || null, updatedAt: new Date() })
      .where(eq(albumPosts.id, albumId));

    revalidatePath(`/album/${albumId}`);
    revalidatePath('/album');
    return succeed({ id: albumId }, '앨범을 수정했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteAlbumPost(albumId: string): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ authorId: albumPosts.authorId })
      .from(albumPosts)
      .where(eq(albumPosts.id, albumId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('앨범을 찾을 수 없습니다.');
    if (!canManage(user, existing.authorId)) return fail('내가 올린 앨범만 삭제할 수 있습니다.');

    const images = await db
      .select({ storagePath: albumImages.storagePath, thumbPath: albumImages.thumbPath })
      .from(albumImages)
      .where(eq(albumImages.albumPostId, albumId));

    await db.delete(albumPosts).where(eq(albumPosts.id, albumId));
    await removeObjects(images.flatMap((i) => [i.storagePath, i.thumbPath].filter(Boolean) as string[]));

    revalidatePath('/album');
    revalidatePath('/home');
    return succeed(undefined, '앨범을 삭제했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}
