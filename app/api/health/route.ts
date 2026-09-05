import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Used after deployment to confirm Vercel can reach Neon. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, database: 'connected' });
  } catch (err) {
    console.error('[health]', err);
    return NextResponse.json({ ok: false, database: 'unreachable' }, { status: 503 });
  }
}
