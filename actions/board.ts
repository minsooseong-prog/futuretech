'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { boardImages, boardPosts, comments, postLikes } from '@/lib/db/schema';
import { canManage, requireUserOrThrow } from '@/lib/auth/guard';
import { removeObjects } from '@/lib/supabase/server';
import { boardPostSchema, commentSchema } from '@/lib/validation/schemas';
import { ownsUploadPath } from '@/lib/uploads';
import { fail, succeed, toActionError, zodToFieldErrors, type ActionResult } from '@/lib/utils/errors';

function parseImagePaths(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v) => typeof v === 'string').slice(0, 10) : [];
  } catch {
    return [];
  }
}

export async function createBoardPost(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const imagePaths = parseImagePaths(formData.get('imagePaths'));

  try {
    const user = await requireUserOrThrow();

    const parsed = boardPostSchema.safeParse({
      category: formData.get('category'),
      title: formData.get('title'),
      content: formData.get('content'),
      imagePaths,
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    // The paths came back from our own upload route, but a hand-crafted
    // request could name someone else's file — check before storing them.
    for (const path of parsed.data.imagePaths) {
      if (!ownsUploadPath(user.id, path)) {
        return fail('잘못된 이미지 경로입니다.');
      }
    }

    const [post] = await db
      .insert(boardPosts)
      .values({
        authorId: user.id,
        category: parsed.data.category,
        title: parsed.data.title,
        content: parsed.data.content,
      })
      .returning({ id: boardPosts.id });

    if (parsed.data.imagePaths.length > 0) {
      try {
        await db.insert(boardImages).values(
          parsed.data.imagePaths.map((storagePath, index) => ({
            postId: post.id,
            storagePath,
            sortOrder: index,
          })),
        );
      } catch (err) {
        // Never leave a post pointing at rows that failed to write.
        await db.delete(boardPosts).where(eq(boardPosts.id, post.id));
        throw err;
      }
    }

    revalidatePath('/board');
    revalidatePath('/home');
    return succeed({ id: post.id }, '글을 올렸습니다.');
  } catch (err) {
    // The post never came into existence, so the uploaded files are orphans.
    await removeObjects(imagePaths);
    return toActionError(err);
  }
}

export async function updateBoardPost(
  postId: string,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ authorId: boardPosts.authorId })
      .from(boardPosts)
      .where(eq(boardPosts.id, postId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('글을 찾을 수 없습니다.');
    if (!canManage(user, existing.authorId)) return fail('내가 쓴 글만 수정할 수 있습니다.');

    const parsed = boardPostSchema.safeParse({
      category: formData.get('category'),
      title: formData.get('title'),
      content: formData.get('content'),
      imagePaths: parseImagePaths(formData.get('imagePaths')),
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '입력값을 확인해 주세요.', fieldErrors);
    }

    await db
      .update(boardPosts)
      .set({
        category: parsed.data.category,
        title: parsed.data.title,
        content: parsed.data.content,
        updatedAt: new Date(),
      })
      .where(eq(boardPosts.id, postId));

    revalidatePath(`/board/${postId}`);
    revalidatePath('/board');
    return succeed({ id: postId }, '글을 수정했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteBoardPost(postId: string): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ authorId: boardPosts.authorId })
      .from(boardPosts)
      .where(eq(boardPosts.id, postId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('글을 찾을 수 없습니다.');
    if (!canManage(user, existing.authorId)) return fail('내가 쓴 글만 삭제할 수 있습니다.');

    // Collect storage keys before the cascade removes the rows.
    const images = await db
      .select({ storagePath: boardImages.storagePath })
      .from(boardImages)
      .where(eq(boardImages.postId, postId));

    await db.delete(boardPosts).where(eq(boardPosts.id, postId));
    await removeObjects(images.map((i) => i.storagePath));

    revalidatePath('/board');
    revalidatePath('/home');
    return succeed(undefined, '글을 삭제했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

/** Called once per detail view from the client. */
export async function registerView(postId: string): Promise<void> {
  try {
    await db
      .update(boardPosts)
      .set({ views: sql`${boardPosts.views} + 1` })
      .where(eq(boardPosts.id, postId));
  } catch (err) {
    console.error('[views]', err);
  }
}

export async function toggleLike(postId: string): Promise<ActionResult<{ liked: boolean }>> {
  try {
    const user = await requireUserOrThrow();

    const existing = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)));
      await db
        .update(boardPosts)
        .set({ likes: sql`greatest(${boardPosts.likes} - 1, 0)` })
        .where(eq(boardPosts.id, postId));
      revalidatePath(`/board/${postId}`);
      return succeed({ liked: false });
    }

    await db.insert(postLikes).values({ postId, userId: user.id });
    await db
      .update(boardPosts)
      .set({ likes: sql`${boardPosts.likes} + 1` })
      .where(eq(boardPosts.id, postId));

    revalidatePath(`/board/${postId}`);
    return succeed({ liked: true });
  } catch (err) {
    return toActionError(err);
  }
}

export async function createComment(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const parentRaw = formData.get('parentId');
    const parsed = commentSchema.safeParse({
      postId: formData.get('postId'),
      parentId: typeof parentRaw === 'string' && parentRaw ? parentRaw : null,
      content: formData.get('content'),
    });

    if (!parsed.success) {
      const fieldErrors = zodToFieldErrors(parsed.error);
      return fail(Object.values(fieldErrors)[0] ?? '댓글을 확인해 주세요.', fieldErrors);
    }

    const post = await db
      .select({ id: boardPosts.id })
      .from(boardPosts)
      .where(eq(boardPosts.id, parsed.data.postId))
      .limit(1);

    if (post.length === 0) return fail('글을 찾을 수 없습니다.');

    await db.insert(comments).values({
      postId: parsed.data.postId,
      authorId: user.id,
      parentId: parsed.data.parentId ?? null,
      content: parsed.data.content,
    });

    revalidatePath(`/board/${parsed.data.postId}`);
    return succeed(undefined, '댓글을 남겼습니다.');
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  try {
    const user = await requireUserOrThrow();

    const rows = await db
      .select({ authorId: comments.authorId, postId: comments.postId })
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    const existing = rows[0];
    if (!existing) return fail('댓글을 찾을 수 없습니다.');
    if (!canManage(user, existing.authorId)) return fail('내가 쓴 댓글만 삭제할 수 있습니다.');

    await db.delete(comments).where(eq(comments.id, commentId));
    revalidatePath(`/board/${existing.postId}`);
    return succeed(undefined, '댓글을 삭제했습니다.');
  } catch (err) {
    return toActionError(err);
  }
}
