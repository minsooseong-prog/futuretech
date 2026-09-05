import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthScreen } from '@/components/auth/auth-screen';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: '로그인 · Future Tech' };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/home');
  return <AuthScreen initialTab="login" />;
}
