import { NextResponse } from 'next/server';

import { auth } from '@/auth';

const publicRoutes = ['/login', '/register'];

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = Boolean(req.auth);
  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', nextUrl.origin);
    if (nextUrl.pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', nextUrl.pathname + nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/', nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
