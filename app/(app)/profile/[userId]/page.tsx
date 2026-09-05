import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Pencil } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardHeader } from '@/components/ui/card';
import { AvatarEditor } from '@/components/profile/avatar-editor';
import {
  ProfileComposer,
  ProfileGallery,
  ProfileNotes,
} from '@/components/profile/profile-composer';
import { db } from '@/lib/db';
import { albumPosts, boardPosts, profileImages, profilePosts, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guard';
import { formatDate } from '@/lib/utils/date';
import { formatClassInfo, roleLabel } from '@/lib/utils/student-id';

export const dynamic = 'force-dynamic';

async function loadUser(userId: string) {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const profile = await loadUser(userId).catch(() => null);
  return { title: profile ? `${profile.name} · Future Tech` : '미니홈 · Future Tech' };
}

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const viewer = await requireUser();
  const { userId } = await params;

  const profile = await loadUser(userId);
  if (!profile) notFound();

  const isOwner = viewer.id === profile.id;

  const [notes, photos, recentPosts, recentAlbums] = await Promise.all([
    db
      .select()
      .from(profilePosts)
      .where(eq(profilePosts.userId, profile.id))
      .orderBy(desc(profilePosts.createdAt))
      .limit(20),
    db
      .select()
      .from(profileImages)
      .where(eq(profileImages.userId, profile.id))
      .orderBy(desc(profileImages.createdAt))
      .limit(24),
    db
      .select({ id: boardPosts.id, title: boardPosts.title, createdAt: boardPosts.createdAt })
      .from(boardPosts)
      .where(eq(boardPosts.authorId, profile.id))
      .orderBy(desc(boardPosts.createdAt))
      .limit(5),
    db
      .select({ id: albumPosts.id, title: albumPosts.title, createdAt: albumPosts.createdAt })
      .from(albumPosts)
      .where(eq(albumPosts.authorId, profile.id))
      .orderBy(desc(albumPosts.createdAt))
      .limit(5),
  ]);

  const detail =
    profile.role === 'student'
      ? formatClassInfo(profile.grade, profile.classNumber, profile.studentNumber)
      : roleLabel(profile.role);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center">
          {isOwner ? (
            <AvatarEditor name={profile.name} currentPath={profile.avatarPath} />
          ) : (
            <Avatar name={profile.name} path={profile.avatarPath} size="xl" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-semibold tracking-tight">{profile.name}</h1>
          <p className="mt-0.5 text-sm text-subtle">{detail}</p>

          {profile.bio ? (
            <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              “{profile.bio}”
            </p>
          ) : (
            isOwner && <p className="mt-3 text-sm text-faint">소개를 아직 쓰지 않았습니다.</p>
          )}

          <p className="mt-3 text-[12px] text-faint">{formatDate(profile.createdAt)} 가입</p>
        </div>

        {isOwner && (
          <Link
            href="/profile/edit"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3.5 text-[13px] text-subtle transition hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            프로필 편집
          </Link>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="한 줄 기록" />
            {isOwner && (
              <div className="border-b border-line p-5">
                <ProfileComposer />
              </div>
            )}
            <ProfileNotes
              canManage={isOwner || viewer.role === 'admin'}
              notes={notes.map((n) => ({
                id: n.id,
                content: n.content,
                createdAt: n.createdAt.toISOString(),
              }))}
            />
          </Card>

          <Card>
            <CardHeader title="사진첩" />
            <ProfileGallery
              canManage={isOwner}
              photos={photos.map((p) => ({
                id: p.id,
                storagePath: p.storagePath,
                thumbPath: p.thumbPath,
              }))}
            />
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="최근 게시글" />
            {recentPosts.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-subtle">쓴 글이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-line">
                {recentPosts.map((post) => (
                  <li key={post.id}>
                    <Link href={`/board/${post.id}`} className="block px-5 py-3 transition hover:bg-canvas">
                      <p className="truncate text-[13px] font-medium">{post.title}</p>
                      <p className="mt-0.5 text-[11px] text-faint">{formatDate(post.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="올린 앨범" />
            {recentAlbums.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-subtle">올린 앨범이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-line">
                {recentAlbums.map((album) => (
                  <li key={album.id}>
                    <Link href={`/album/${album.id}`} className="block px-5 py-3 transition hover:bg-canvas">
                      <p className="truncate text-[13px] font-medium">{album.title}</p>
                      <p className="mt-0.5 text-[11px] text-faint">{formatDate(album.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
