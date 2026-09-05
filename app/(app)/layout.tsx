import { desc } from 'drizzle-orm';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { requireUser } from '@/lib/auth/guard';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate. Middleware only checked that a cookie existed.
  const user = await requireUser();

  const recent = await db
    .select({ id: notices.id, title: notices.title, createdAt: notices.createdAt })
    .from(notices)
    .orderBy(desc(notices.createdAt))
    .limit(5);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const unread = recent.some((n) => n.createdAt >= weekAgo);

  return (
    <div className="min-h-dvh">
      <Header
        user={user}
        unread={unread}
        notices={recent.map((n) => ({
          id: n.id,
          title: n.title,
          createdAt: n.createdAt.toISOString(),
        }))}
      />

      <div className="mx-auto flex w-full max-w-[1400px]">
        <Sidebar userId={user.id} />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12">{children}</main>
      </div>

      <MobileNav />
    </div>
  );
}
