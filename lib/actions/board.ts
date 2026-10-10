'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, count, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { boardImages, boardLikes, boardPosts, comments } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { removeObjects } from '@/lib/supabase/server';
import { isOwnedPath } from '@/lib/storage-paths';
import { boardPostSchema, commentSchema, firstError } from '@/lib/validation/schemas';
import { LIMITS } from '@/lib/constants';
import { str, strList } from '@/lib/actions/helpers';
import type { ActionState } from '@/lib/actions/types';

const LOGIN_REQUIRED = { error: '로그인이 필요합니다.' };

function readPost(fd: FormData) {
  return boardPostSchema.safeParse({
    category: str(fd, 'category'),
    title: str(fd, 'title'),
    content: str(fd, 'content'),
  });
}

export async function createBoardPost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;

  const paths = strList(fd, 'imagePaths');
  const owned = paths.filter((p) => isOwnedPath(p, 'board', user.id));
  const fail = async (error: string) => {
    await removeObjects(owned);
    return { error };
  };

  if (owned.length !== paths.length || paths.length > LIMITS.boardImages) return fail('잘못된 이미지 요청입니다.');
  const parsed = readPost(fd);
  if (!parsed.success) return fail(firstError(parsed.error));

  let postId: number;
  try {
    const [post] = await db
      .insert(boardPosts)
      .values({ ...parsed.data, authorId: user.id })
      .returning({ id: boardPosts.id });
    postId = post.id;
  } catch (e) {
    console.error('[board create]', e);
    return fail('게시글을 저장하지 못했습니다.');
  }

  if (owned.length > 0) {
    try {
      await db.insert(boardImages).values(owned.map((storagePath, i) => ({ postId, storagePath, sortOrder: i })));
    } catch (e) {
      console.error('[board images]', e);
      await db.delete(boardPosts).where(eq(boardPosts.id, postId));
      return fail('사진을 저장하지 못했습니다.');
    }
  }

  revalidatePath('/board');
  revalidatePath('/home');
  redirect(`/board/${postId}`);
}

export async function updateBoardPost(postId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;

  const newPaths = strList(fd, 'imagePaths');
  const owned = newPaths.filter((p) => isOwnedPath(p, 'board', user.id));
  const fail = async (error: string) => {
    await removeObjects(owned);
    return { error };
  };
  if (owned.length !== newPaths.length) return fail('잘못된 이미지 요청입니다.');

  const [post] = await db
    .select({ authorId: boardPosts.authorId })
    .from(boardPosts)
    .where(eq(boardPosts.id, postId))
    .limit(1);
  if (!post) return fail('게시글을 찾을 수 없습니다.');
  if (post.authorId !== user.id) return fail('본인이 작성한 글만 수정할 수 있습니다.');

  const parsed = readPost(fd);
  if (!parsed.success) return fail(firstError(parsed.error));

  const removeIds = strList(fd, 'removeImageIds');
  const current = await db
    .select({ id: boardImages.id, storagePath: boardImages.storagePath, sortOrder: boardImages.sortOrder })
    .from(boardImages)
    .where(eq(boardImages.postId, postId));
  const toRemove = current.filter((img) => removeIds.includes(img.id));
  const remaining = current.length - toRemove.length;
  if (remaining + owned.length > LIMITS.boardImages) return fail(`사진은 최대 ${LIMITS.boardImages}장까지 첨부할 수 있습니다.`);

  try {
    await db
      .update(boardPosts)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(boardPosts.id, postId), eq(boardPosts.authorId, user.id)));
    if (owned.length > 0) {
      const base = current.reduce((m, c) => Math.max(m, c.sortOrder), -1) + 1;
      await db.insert(boardImages).values(owned.map((storagePath, i) => ({ postId, storagePath, sortOrder: base + i })));
    }
    if (toRemove.length > 0) {
      await db.delete(boardImages).where(and(eq(boardImages.postId, postId), inArray(boardImages.id, toRemove.map((r) => r.id))));
    }
  } catch (e) {
    console.error('[board update]', e);
    return fail('게시글을 수정하지 못했습니다.');
  }
  await removeObjects(toRemove.map((r) => r.storagePath));

  revalidatePath('/board');
  revalidatePath(`/board/${postId}`);
  redirect(`/board/${postId}`);
}

export async function deleteBoardPost(postId: number): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  const [post] = await db
    .select({ authorId: boardPosts.authorId })
    .from(boardPosts)
    .where(eq(boardPosts.id, postId))
    .limit(1);
  if (!post) return { error: '게시글을 찾을 수 없습니다.' };
  if (post.authorId !== user.id && user.role !== 'admin') return { error: '삭제 권한이 없습니다.' };

  const images = await db.select({ storagePath: boardImages.storagePath }).from(boardImages).where(eq(boardImages.postId, postId));
  await db.delete(boardPosts).where(eq(boardPosts.id, postId));
  await removeObjects(images.map((i) => i.storagePath));

  revalidatePath('/board');
  revalidatePath('/home');
  redirect('/board');
}

export async function toggleLike(postId: number): Promise<{ liked: boolean; likes: number } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  const existing = await db
    .select({ postId: boardLikes.postId })
    .from(boardLikes)
    .where(and(eq(boardLikes.postId, postId), eq(boardLikes.userId, user.id)))
    .limit(1);
  try {
    if (existing.length > 0) {
      await db.delete(boardLikes).where(and(eq(boardLikes.postId, postId), eq(boardLikes.userId, user.id)));
    } else {
      await db.insert(boardLikes).values({ postId, userId: user.id }).onConflictDoNothing();
    }
  } catch {
    return { error: '추천하지 못했습니다.' };
  }
  const [row] = await db.select({ n: count() }).from(boardLikes).where(eq(boardLikes.postId, postId));
  revalidatePath('/board');
  return { liked: existing.length === 0, likes: row?.n ?? 0 };
}

export async function createComment(postId: number, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  const parsed = commentSchema.safeParse({ content: str(fd, 'content') });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const [post] = await db.select({ id: boardPosts.id }).from(boardPosts).where(eq(boardPosts.id, postId)).limit(1);
  if (!post) return { error: '게시글을 찾을 수 없습니다.' };
  await db.insert(comments).values({ postId, authorId: user.id, content: parsed.data.content });
  revalidatePath(`/board/${postId}`);
  return { ok: true };
}

export async function deleteComment(commentId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_REQUIRED;
  const [c] = await db
    .select({ authorId: comments.authorId, postId: comments.postId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!c) return { error: '댓글을 찾을 수 없습니다.' };
  if (c.authorId !== user.id && user.role !== 'admin') return { error: '삭제 권한이 없습니다.' };
  await db.delete(comments).where(eq(comments.id, commentId));
  revalidatePath(`/board/${c.postId}`);
  return { ok: true };
}
