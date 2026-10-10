import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { PenLine, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import { profileImages, profilePosts, users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { signImagePaths, signUrls } from '@/lib/supabase/server';
import { deleteProfileImages, deleteProfilePost } from '@/lib/actions/profile';
import { isUuid } from '@/lib/storage-paths';
import { formatDate, formatRelative } from '@/lib/utils/date';
import { formatStudentInfo } from '@/lib/utils/student';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmAction } from '@/components/ui/ConfirmAction';
import { Gallery } from '@/components/album/Gallery';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProfilePostComposer } from '@/components/profile/ProfilePostComposer';
import { ProfilePhotoUploader } from '@/components/profile/ProfilePhotoUploader';

type Params = Promise<{ userId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { userId } = await params;
  if (!isUuid(userId)) return { title: '프로필' };
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  return { title: u?.name ?? '프로필' };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const me = await requireUser();
  const { userId } = await params;
  if (!isUuid(userId)) notFound();

  const [profile] = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      grade: users.grade,
      classNumber: users.classNumber,
      studentNumber: users.studentNumber,
      avatarPath: users.avatarPath,
      bio: users.bio,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!profile) notFound();

  const [posts, photos] = await Promise.all([
    db.select().from(profilePosts).where(eq(profilePosts.userId, userId)).orderBy(desc(profilePosts.createdAt)).limit(100),
    db.select().from(profileImages).where(eq(profileImages.userId, userId)).orderBy(desc(profileImages.createdAt)).limit(120),
  ]);

  const [avatarUrls, photoUrl] = await Promise.all([
    signUrls([profile.avatarPath]),
    signImagePaths(photos.map((p) => p.storagePath)),
  ]);
  const isOwner = me.id === profile.id;
  const galleryImages = photos.map((p) => ({ id: p.id, ...photoUrl(p.storagePath) }));

  const postsPanel = (
    <div>
      {isOwner && <ProfilePostComposer />}
      {posts.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{isOwner ? '첫 글을 남겨보세요.' : '아직 작성한 글이 없습니다.'}</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id} className="card p-4">
              <p className="prose-plain text-sm">{p.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <time className="text-xs text-muted" dateTime={p.createdAt.toISOString()}>
                  {formatRelative(p.createdAt)}
                </time>
                {isOwner && (
                  <ConfirmAction
                    action={deleteProfilePost.bind(null, p.id)}
                    label={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    ariaLabel="글 삭제"
                    className="h-7 px-2"
                    title="글을 삭제할까요?"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const photosPanel = (
    <div>
      {isOwner && <ProfilePhotoUploader />}
      {photos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{isOwner ? '사진을 올려 갤러리를 채워보세요.' : '아직 올린 사진이 없습니다.'}</p>
      ) : (
        <>
          <Gallery layout="grid" alt={`${profile.name}의 사진`} images={galleryImages} />
          {isOwner && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted hover:text-ink">사진 정리하기</summary>
              <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {galleryImages.map((img) => (
                  <li key={img.id} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-subtle">
                    {img.thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                    <span className="absolute right-1 top-1 rounded-md bg-card/90">
                      <ConfirmAction
                        action={deleteProfileImages.bind(null, [img.id])}
                        label={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                        ariaLabel="사진 삭제"
                        className="h-7 px-2"
                        title="사진을 삭제할까요?"
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <header className="card mb-6 p-6 md:p-8">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <Avatar src={profile.avatarPath ? avatarUrls[profile.avatarPath] : null} name={profile.name} size={104} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.6rem] font-semibold tracking-[-0.02em]">{profile.name}</h1>
            <p className="mt-0.5 text-sm text-muted">{formatStudentInfo(profile)}</p>
            {profile.bio ? (
              <p className="mt-4 font-hand text-[1.6rem] leading-snug">“{profile.bio}”</p>
            ) : (
              isOwner && <p className="mt-4 text-sm text-muted">아직 소개가 없습니다.</p>
            )}
            <p className="mt-4 text-xs text-muted">{formatDate(profile.createdAt)} 가입</p>
          </div>
          {isOwner && (
            <Link href="/profile/edit" className="btn-secondary btn-sm">
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
              프로필 편집
            </Link>
          )}
        </div>
      </header>

      <ProfileTabs
        tabs={[
          { id: 'posts', label: '글', count: posts.length, content: postsPanel },
          { id: 'photos', label: '사진', count: photos.length, content: photosPanel },
        ]}
      />
    </div>
  );
}
