import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AuthScreen } from '@/components/auth/AuthScreen';

export const metadata: Metadata = { title: '회원가입' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/home');
  return <AuthScreen initialTab="register" />;
}
