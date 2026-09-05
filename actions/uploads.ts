'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { albumImages, boardImages, profileImages, users } from '@/lib/db/schema';
import { requireUserOrThrow } from '@/lib/auth/guard';
import { removeObjects } from '@/lib/supabase/server';
import { ownsUploadPath } from '@/lib/uploads';
import { fail, succeed, toActionError, type ActionResult } from '@/lib/utils/errors';

/**
 * Removes a file that was uploaded but never attached to anything — for
 * instance when someone picks a photo and then takes it out of the form again.
 * Refuses to touch a path that any row still points at, so a live image can
 * never be deleted through this route.
 */
export async function discardUpload(path: string): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    if (!ownsUploadPath(user.id, path)) {
      return fail('내가 올린 파일만 지울 수 있습니다.');
    }

    const [inAlbum, inBoard, inProfile, asAvatar] = await Promise.all([
      db.select({ id: albumImages.id }).from(albumImages).where(eq(albumImages.storagePath, path)).limit(1),
      db.select({ id: boardImages.id }).from(boardImages).where(eq(boardImages.storagePath, path)).limit(1),
      db.select({ id: profileImages.id }).from(profileImages).where(eq(profileImages.storagePath, path)).limit(1),
      db.select({ id: users.id }).from(users).where(eq(users.avatarPath, path)).limit(1),
    ]);

    if (inAlbum.length || inBoard.length || inProfile.length || asAvatar.length) {
      return fail('이미 사용 중인 파일입니다.');
    }

    await removeObjects([path]);
    return succeed(undefined, '파일을 지웠습니다.');
  } catch (err) {
    return toActionError(err);
  }
}
