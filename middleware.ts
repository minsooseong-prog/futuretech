import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'ft_session';

const PROTECTED = [
  '/home',
  '/album',
  '/board',
  '/notices',
  '/members',
  '/calendar',
  '/profile',
  '/settings',
  '/search',
];

/**
 * Middleware runs on the edge and only checks whether a session cookie exists —
 * it is a redirect for convenience, not an authorization check. Every page and
 * every action re-verifies the session against the database.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (hasCookie && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/home';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)'],
};
