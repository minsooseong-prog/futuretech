'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { albumImages, albumPosts } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { removeObjects } from '@/lib/supabase/server';
import { isOwnedPath, isUuid } from '@/lib/storage-paths';
import { albumPostSchema, firstError } from '@/lib/validation/schemas';
import { LIMITS } from '@/lib/constants';
import { str, strList } from '@/lib/actions/helpers';
import type { ActionState } from '@/lib/actions/types';

const LOGIN_REQUIRED = { error: '로그인이 필요합니다.' };

export async function createAlbumPost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;

  const paths = strList(fd, 'imagePaths');
  const owned = paths.filter((p) => isOwnedPath(p, 'album', user.id));
  const fail = async (error: string) => {
    await removeObjects(owned);
    return { error };
  };

  if (owned.length !== paths.length) return fail('잘못된 이미지 요청입니다.');
  if (owned.length === 0) return fail('사진을 한 장 이상 추가해주세요.');
  if (owned.length > LIMITS.albumImages) return fail(`사진은 최대 ${LIMITS.albumImages}장까지 올릴 수 있습니다.`);

  const parsed = albumPostSchema.safeParse({ title: str(fd, 'title'), description: str(fd, 'description') });
  if (!parsed.success) return fail(firstError(parsed.error));

  let albumId: string;
  try {
    const [post] = await db
      .insert(albumPosts)
      .values({ ...parsed.data, authorId: user.id })
      .returning({ id: albumPosts.id });
    albumId = post.id;
  } catch (e) {
    console.error('[album create]', e);
    return fail('앨범을 저장하지 못했습니다.');
  }

  try {
    await db
      .insert(albumImages)
      .values(owned.map((storagePath, i) => ({ albumPostId: albumId, storagePath, sortOrder: i })));
  } catch (e) {
    console.error('[album images]', e);
    await db.delete(albumPosts).where(eq(albumPosts.id, albumId));
    return fail('사진 정보를 저장하지 못했습니다.');
  }

  revalidatePath('/album');
  revalidatePath('/home');
  redirect(`/album/${albumId}`);
}

export async function updateAlbumPost(albumId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;

  const newPaths = strList(fd, 'imagePaths');
  const owned = newPaths.filter((p) => isOwnedPath(p, 'album', user.id));
  const fail = async (error: string) => {
    await removeObjects(owned);
    return { error };
  };
  if (owned.length !== newPaths.length || !isUuid(albumId)) return fail('잘못된 요청입니다.');

  const [post] = await db.select({ authorId: albumPosts.authorId }).from(albumPosts).where(eq(albumPosts.id, albumId)).limit(1);
  if (!post) return fail('앨범을 찾을 수 없습니다.');
  if (post.authorId !== user.id) return fail('본인이 올린 앨범만 수정할 수 있습니다.');

  const parsed = albumPostSchema.safeParse({ title: str(fd, 'title'), description: str(fd, 'description') });
  if (!parsed.success) return fail(firstError(parsed.error));

  const removeIds = strList(fd, 'removeImageIds');
  const current = await db
    .select({ id: albumImages.id, storagePath: albumImages.storagePath, sortOrder: albumImages.sortOrder })
    .from(albumImages)
    .where(eq(albumImages.albumPostId, albumId));
  const toRemove = current.filter((img) => removeIds.includes(img.id));
  const remaining = current.length - toRemove.length + owned.length;
  if (remaining === 0) return fail('사진이 한 장 이상 있어야 합니다.');
  if (remaining > LIMITS.albumImages) return fail(`사진은 최대 ${LIMITS.albumImages}장까지 올릴 수 있습니다.`);

  try {
    await db
      .update(albumPosts)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(albumPosts.id, albumId), eq(albumPosts.authorId, user.id)));
    if (owned.length > 0) {
      const base = current.reduce((m, c) => Math.max(m, c.sortOrder), -1) + 1;
      await db
        .insert(albumImages)
        .values(owned.map((storagePath, i) => ({ albumPostId: albumId, storagePath, sortOrder: base + i })));
    }
    if (toRemove.length > 0) {
      await db
        .delete(albumImages)
        .where(and(eq(albumImages.albumPostId, albumId), inArray(albumImages.id, toRemove.map((r) => r.id))));
    }
  } catch (e) {
    console.error('[album update]', e);
    return fail('앨범을 수정하지 못했습니다.');
  }
  await removeObjects(toRemove.map((r) => r.storagePath));

  revalidatePath('/album');
  revalidatePath(`/album/${albumId}`);
  redirect(`/album/${albumId}`);
}

export async function deleteAlbumPost(albumId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (!isUuid(albumId)) return { error: '잘못된 요청입니다.' };
  const [post] = await db.select({ authorId: albumPosts.authorId }).from(albumPosts).where(eq(albumPosts.id, albumId)).limit(1);
  if (!post) return { error: '앨범을 찾을 수 없습니다.' };
  if (post.authorId !== user.id && user.role !== 'admin') return { error: '삭제 권한이 없습니다.' };

  const images = await db.select({ storagePath: albumImages.storagePath }).from(albumImages).where(eq(albumImages.albumPostId, albumId));
  await db.delete(albumPosts).where(eq(albumPosts.id, albumId));
  await removeObjects(images.map((i) => i.storagePath));

  revalidatePath('/album');
  revalidatePath('/home');
  redirect('/album');
}
