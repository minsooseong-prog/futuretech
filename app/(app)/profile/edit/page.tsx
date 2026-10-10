import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth/session';
import { signUrls } from '@/lib/supabase/server';
import { formatStudentInfo } from '@/lib/utils/student';
import { AvatarForm } from '@/components/profile/AvatarForm';
import { BioForm } from '@/components/profile/BioForm';
import { PageHeader } from '@/components/ui/PageHeader';

export const metadata: Metadata = { title: '프로필 편집' };

export default async function EditProfilePage() {
  const user = await requireUser();
  const urls = await signUrls([user.avatarPath]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/profile/${user.id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        내 프로필
      </Link>
      <PageHeader title="프로필 편집" description={`${user.name}  ${formatStudentInfo(user)}`} />
      <div className="space-y-4">
        <AvatarForm name={user.name} currentUrl={user.avatarPath ? urls[user.avatarPath] ?? null : null} hasAvatar={!!user.avatarPath} />
        <BioForm bio={user.bio ?? ''} />
        <p className="px-1 text-xs text-muted">이름과 학번은 직접 바꿀 수 없습니다. 잘못 등록되었다면 선생님께 문의하세요.</p>
      </div>
    </div>
  );
}
