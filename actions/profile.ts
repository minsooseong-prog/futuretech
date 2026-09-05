'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { profileImages, profilePosts, users } from '@/lib/db/schema';
import { canManage, requireUserOrThrow } from '@/lib/auth/guard';
import { removeObjects } from '@/lib/supabase/server';
import { ownsUploadPath } from '@/lib/uploads';
import { profilePostSchema, profileSchema } from '@/lib/validation/schemas';
import { fail, succeed, toActionError, zodToFieldErrors, type ActionResult } from '@/lib/utils/errors';

export async function updateProfile(_prev: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const parsed = profileSchema.safeParse({ bio: formData.get('bio') ?? '' });
    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    await db
      .update(users)
      .set({ bio: parsed.data.bio || null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    revalidatePath(`/profile/${user.id}`);
    return succeed(undefined, '소개를 저장했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * The client uploads through /api/upload first, then hands the returned path
 * here. The path is checked to be inside the caller's own avatar folder, so a
 * tampered request cannot claim someone else's file.
 */
export async function updateAvatar(storagePath: string): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    if (!ownsUploadPath(user.id, storagePath) || !storagePath.startsWith('avatars/')) {
      return fail('잘못된 이미지 경로입니다.');
    }

    const rows = await db
      .select({ avatarPath: users.avatarPath })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const previous = rows[0]?.avatarPath ?? null;

    await db
      .update(users)
      .set({ avatarPath: storagePath, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Only remove the old file once the new one is safely recorded.
    if (previous && previous !== storagePath) await removeObjects([previous]);

    revalidatePath(`/profile/${user.id}`);
    revalidatePath('/members');
    return succeed(undefined, '프로필 사진을 바꿨습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function removeAvatar(): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ avatarPath: users.avatarPath })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const previous = rows[0]?.avatarPath ?? null;

    await db.update(users).set({ avatarPath: null, updatedAt: new Date() }).where(eq(users.id, user.id));
    if (previous) await removeObjects([previous]);

    revalidatePath(`/profile/${user.id}`);
    revalidatePath('/members');
    return succeed(undefined, '프로필 사진을 지웠습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function createProfilePost(_prev: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const parsed = profilePostSchema.safeParse({ content: formData.get('content') });
    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '내용을 확인해 주세요.', fieldErrors);
    }

    await db.insert(profilePosts).values({ userId: user.id, content: parsed.data.content });

    revalidatePath(`/profile/${user.id}`);
    return succeed(undefined, '한 줄을 남겼습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteProfilePost(postId: string): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ userId: profilePosts.userId })
      .from(profilePosts)
      .where(eq(profilePosts.id, postId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('글을 찾을 수 없습니다.');
    if (!canManage(user, existing.userId)) return fail('내 미니홈의 글만 삭제할 수 있습니다.');

    await db.delete(profilePosts).where(eq(profilePosts.id, postId));

    revalidatePath(`/profile/${existing.userId}`);
    return succeed(undefined, '삭제했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function addProfileImages(
  images: { path: string; thumbPath: string | null }[],
): Promise<ActionResult> {
  const paths = images.flatMap((i) => [i.path, i.thumbPath].filter(Boolean) as string[]);

  try {
    const user = await requireUserOrThrow();

    if (images.length === 0) return fail('사진을 선택해 주세요.');
    if (images.length > 10) return fail('한 번에 10장까지 올릴 수 있습니다.');

    for (const image of images) {
      if (!ownsUploadPath(user.id, image.path) || !image.path.startsWith('profile/')) {
        return fail('잘못된 이미지 경로입니다.');
      }
    }

    await db.insert(profileImages).values(
      images.map((image) => ({
        userId: user.id,
        storagePath: image.path,
        thumbPath: image.thumbPath ?? null,
      })),
    );

    revalidatePath(`/profile/${user.id}`);
    return succeed(undefined, '사진을 올렸습니다.');
  } catch (err) {
    await removeObjects(paths);
    return toActionError(err);
  }
}

export async function deleteProfileImage(imageId: string): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select()
      .from(profileImages)
      .where(eq(profileImages.id, imageId))
      .limit(1);

    const image = rows[0];
    if (!image) return fail('사진을 찾을 수 없습니다.');
    if (!canManage(user, image.userId)) return fail('내 사진만 삭제할 수 있습니다.');

    await db
      .delete(profileImages)
      .where(and(eq(profileImages.id, imageId), eq(profileImages.userId, image.userId)));

    await removeObjects([image.storagePath, image.thumbPath].filter(Boolean) as string[]);

    revalidatePath(`/profile/${image.userId}`);
    return succeed(undefined, '사진을 지웠습니다.');
  } catch (err) {
    return toActionError(err);
  }
}
