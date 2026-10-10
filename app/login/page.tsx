import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AuthScreen } from '@/components/auth/AuthScreen';

export const metadata: Metadata = { title: '로그인' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ graduated?: string }> }) {
  if (await getCurrentUser()) redirect('/home');
  const { graduated } = await searchParams;
  return (
    <AuthScreen
      initialTab="login"
      notice={graduated ? '졸업을 축하합니다. 계정이 삭제되었고 이름은 졸업생 목록에 남았습니다.' : undefined}
    />
  );
}
