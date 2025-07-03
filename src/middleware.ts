import { NextResponse } from 'next/server';
import { ROUTES } from '@/lib/endpoints';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for authentication cookies
  const localToken = request.cookies.get('localToken')?.value;
  const remoteToken = request.cookies.get('remoteToken')?.value;
  const currentUser = request.cookies.get('currentApiUser')?.value;

  // Protected routes
  const protectedRoutes = ['/users', '/dashboard', '/profile', '/theses', '/universities', '/reserved-titles', '/archive', '/manage-data'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // If accessing protected route without authentication, redirect to login
  if (isProtectedRoute && (!localToken && !remoteToken)) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // If accessing login page while authenticated, redirect to dashboard
  if (request.nextUrl.pathname === ROUTES.LOGIN && (localToken || remoteToken)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};