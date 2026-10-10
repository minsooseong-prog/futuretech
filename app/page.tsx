import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { AuthScreen } from '@/components/auth/AuthScreen';

export default async function LandingPage() {
  if (await getCurrentUser()) redirect('/home');
  return <AuthScreen initialTab="login" />;
}
