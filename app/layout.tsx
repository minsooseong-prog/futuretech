import type { Metadata, Viewport } from 'next';
import { Caveat } from 'next/font/google';
import { getCurrentUser } from '@/lib/auth/session';
import './globals.css';

const hand = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-hand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Future Tech', template: '%s | Future Tech' },
  description: '미래공학 클래스 커뮤니티',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e0f' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let theme: 'light' | 'dark' = 'light';
  try {
    const user = await getCurrentUser();
    if (user) theme = user.theme;
  } catch {
    // DB가 아직 설정되지 않은 경우에도 페이지는 렌더링합니다.
  }

  return (
    <html lang="ko" className={`${hand.variable} ${theme === 'dark' ? 'dark' : ''}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
