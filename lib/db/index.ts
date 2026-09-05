import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');
}

/**
 * Neon's HTTP driver is stateless: each query is one fetch() call, so nothing is
 * held open between invocations. That is what a Vercel serverless function needs —
 * no pool to exhaust, no socket to leak, no long-lived process required.
 */
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export { schema };
