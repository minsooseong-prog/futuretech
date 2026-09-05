'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  albumImages,
  albumPosts,
  alumni,
  boardImages,
  boardPosts,
  profileImages,
  users,
} from '@/lib/db/schema';
import { requireUserOrThrow } from '@/lib/auth/guard';
import { verifyPassword } from '@/lib/auth/password';
import { destroyAllSessionsFor, destroyCurrentSession } from '@/lib/auth/session';
import { removeObjects } from '@/lib/supabase/server';
import { deleteAccountSchema } from '@/lib/validation/schemas';
import { fail, toActionError, zodToFieldErrors, type ActionResult } from '@/lib/utils/errors';

/**
 * Graduation: three independent confirmations, all re-checked here, then the
 * account and everything private to it is removed. Only a name and a date stay
 * behind for the 졸업생 list.
 */
export async function deleteAccount(_prev: unknown, formData: FormData): Promise<ActionResult> {
  let done = false;

  try {
    const user = await requireUserOrThrow();

    if (user.role === 'admin') {
      return fail('관리자 계정은 이 방법으로 삭제할 수 없습니다.');
    }

    const parsed = deleteAccountSchema.safeParse({
      password: formData.get('password'),
      passwordAgain: formData.get('passwordAgain'),
      phrase: formData.get('phrase'),
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    const rows = await db
      .select({ passwordHash: users.passwordHash, name: users.name })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const account = rows[0];
    if (!account) return fail('계정을 찾을 수 없습니다.');

    // 1. Re-authenticate on the server, not just in the browser.
    if (!(await verifyPassword(parsed.data.password, account.passwordHash))) {
      return fail('비밀번호가 올바르지 않습니다.', { password: '비밀번호가 올바르지 않습니다.' });
    }

    // 2. Gather every object this person owns before the rows disappear.
    const storagePaths: string[] = [];

    const [avatarRow] = await db
      .select({ avatarPath: users.avatarPath })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (avatarRow?.avatarPath) storagePaths.push(avatarRow.avatarPath);

    const galleries = await db
      .select({ storagePath: profileImages.storagePath, thumbPath: profileImages.thumbPath })
      .from(profileImages)
      .where(eq(profileImages.userId, user.id));
    for (const image of galleries) {
      storagePaths.push(image.storagePath);
      if (image.thumbPath) storagePaths.push(image.thumbPath);
    }

    const ownAlbums = await db
      .select({ id: albumPosts.id })
      .from(albumPosts)
      .where(eq(albumPosts.authorId, user.id));
    for (const album of ownAlbums) {
      const images = await db
        .select({ storagePath: albumImages.storagePath, thumbPath: albumImages.thumbPath })
        .from(albumImages)
        .where(eq(albumImages.albumPostId, album.id));
      for (const image of images) {
        storagePaths.push(image.storagePath);
        if (image.thumbPath) storagePaths.push(image.thumbPath);
      }
    }

    const ownPosts = await db
      .select({ id: boardPosts.id })
      .from(boardPosts)
      .where(eq(boardPosts.authorId, user.id));
    for (const post of ownPosts) {
      const images = await db
        .select({ storagePath: boardImages.storagePath })
        .from(boardImages)
        .where(eq(boardImages.postId, post.id));
      for (const image of images) storagePaths.push(image.storagePath);
    }

    // 3. Write the alumni record and remove the account in one atomic batch —
    //    Neon's HTTP driver runs a batch inside a single transaction, so the
    //    account can never disappear without its alumni row. Every dependent
    //    row (posts, photos, comments, sessions, preferences) goes with it
    //    through ON DELETE CASCADE.
    await db.batch([
      db.insert(alumni).values({ name: account.name, graduatedAt: new Date() }),
      db.delete(users).where(eq(users.id, user.id)),
    ]);

    // 4. Sessions are already gone via cascade; clear this browser's cookie.
    await destroyAllSessionsFor(user.id).catch(() => {});
    await destroyCurrentSession();

    // 5. Storage cleanup last — a failure here leaves orphan files, never a
    //    half-deleted account.
    await removeObjects(storagePaths);

    done = true;
  } catch (err) {
    return toActionError(err);
  }

  if (done) redirect('/login');
  return fail('계정을 삭제하지 못했습니다.');
}
