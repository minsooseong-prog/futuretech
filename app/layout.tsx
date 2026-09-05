import type { Metadata, Viewport } from 'next';
import { Inter, Caveat } from 'next/font/google';
import { cookies } from 'next/headers';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Caveat is a fast, connected hand — the closest free face to a marker scrawl.
const hand = Caveat({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-hand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Future Tech',
  description: '미래공학 학급 커뮤니티 — 사진, 이야기, 일정을 한곳에.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfb' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e0f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The theme cookie is mirrored from the user's saved preference at login, so
  // the first paint is already correct and there is no flash.
  const theme = (await cookies()).get('ft_theme')?.value === 'dark' ? 'dark' : 'light';

  return (
    <html lang="ko" className={`${sans.variable} ${hand.variable} ${theme === 'dark' ? 'dark' : ''}`}>
      <body className="min-h-dvh bg-canvas font-sans text-ink antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
