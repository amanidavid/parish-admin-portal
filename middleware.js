import { NextResponse } from 'next/server';
import { ADMIN_TOKEN_KEY } from '@/constants/cookies';

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_TOKEN_KEY)?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) return NextResponse.next();

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],

};
