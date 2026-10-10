import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { signUrls } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const [[latest], urls] = await Promise.all([
    db.select({ createdAt: notices.createdAt }).from(notices).orderBy(desc(notices.createdAt)).limit(1),
    signUrls([user.avatarPath]),
  ]);
  const hasNewNotice = !!latest && Date.now() - latest.createdAt.getTime() < 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
        본문으로 건너뛰기
      </a>
      <Header
        userId={user.id}
        name={user.name}
        avatarUrl={user.avatarPath ? urls[user.avatarPath] ?? null : null}
        hasNewNotice={hasNewNotice}
      />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar userId={user.id} />
        <main id="main" className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-8">
          {children}
        </main>
      </div>
      <MobileNav userId={user.id} />
    </div>
  );
}
