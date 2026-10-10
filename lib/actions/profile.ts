'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { profileImages, profilePosts, users } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { removeObjects } from '@/lib/supabase/server';
import { isOwnedPath } from '@/lib/storage-paths';
import { bioSchema, firstError, profilePostSchema } from '@/lib/validation/schemas';
import { LIMITS } from '@/lib/constants';
import { str } from '@/lib/actions/helpers';
import type { ActionState } from '@/lib/actions/types';

const LOGIN_REQUIRED = { error: '로그인이 필요합니다.' };

export async function updateBio(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  const parsed = bioSchema.safeParse(str(fd, 'bio'));
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.update(users).set({ bio: parsed.data || null, updatedAt: new Date() }).where(eq(users.id, user.id));
  revalidatePath(`/profile/${user.id}`);
  return { ok: true, message: '소개를 저장했습니다.' };
}

export async function updateAvatar(path: string | null): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (path !== null && !isOwnedPath(path, 'avatars', user.id)) {
    return { error: '잘못된 이미지 경로입니다.' };
  }
  const previous = user.avatarPath;
  try {
    await db.update(users).set({ avatarPath: path, updatedAt: new Date() }).where(eq(users.id, user.id));
  } catch (e) {
    console.error('[avatar]', e);
    if (path) await removeObjects([path], false);
    return { error: '프로필 사진을 저장하지 못했습니다.' };
  }
  if (previous && previous !== path) await removeObjects([previous], false);
  revalidatePath('/', 'layout');
  return { ok: true, message: path ? '프로필 사진을 변경했습니다.' : '프로필 사진을 삭제했습니다.' };
}

export async function createProfilePost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  const parsed = profilePostSchema.safeParse(str(fd, 'content'));
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.insert(profilePosts).values({ userId: user.id, content: parsed.data });
  revalidatePath(`/profile/${user.id}`);
  return { ok: true };
}

export async function deleteProfilePost(postId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  // WHERE 절에 작성자 조건을 넣어 다른 사람 글은 삭제되지 않습니다.
  await db.delete(profilePosts).where(and(eq(profilePosts.id, postId), eq(profilePosts.userId, user.id)));
  revalidatePath(`/profile/${user.id}`);
  return { ok: true };
}

export async function addProfileImages(paths: string[]): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  const valid = Array.isArray(paths) && paths.length > 0 && paths.length <= LIMITS.profileImagesPerUpload;
  const owned = valid ? paths.filter((p) => isOwnedPath(p, 'profile', user.id)) : [];
  if (!valid || owned.length !== paths.length) {
    await removeObjects(owned);
    return { error: '잘못된 업로드 요청입니다.' };
  }
  try {
    await db.insert(profileImages).values(owned.map((storagePath) => ({ userId: user.id, storagePath })));
  } catch (e) {
    console.error('[profile images]', e);
    await removeObjects(owned);
    return { error: '사진을 저장하지 못했습니다.' };
  }
  revalidatePath(`/profile/${user.id}`);
  return { ok: true };
}

export async function deleteProfileImages(imageIds: string[]): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  if (!Array.isArray(imageIds) || imageIds.length === 0) return { ok: true };
  const deleted = await db
    .delete(profileImages)
    .where(and(inArray(profileImages.id, imageIds.slice(0, 50)), eq(profileImages.userId, user.id)))
    .returning({ storagePath: profileImages.storagePath });
  await removeObjects(deleted.map((d) => d.storagePath));
  revalidatePath(`/profile/${user.id}`);
  return { ok: true };
}
