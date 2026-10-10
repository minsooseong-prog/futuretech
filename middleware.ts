import { NextResponse, type NextRequest } from 'next/server';

// 쿠키 존재 여부만 빠르게 확인합니다.
// 실제 세션 검증과 권한 검사는 모든 서버 컴포넌트/서버 액션에서 다시 수행합니다.
const PROTECTED = ['/home', '/album', '/board', '/notices', '/members', '/calendar', '/profile', '/settings', '/search'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !req.cookies.has('ft_session')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
