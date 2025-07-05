import { NextResponse } from 'next/server';
import { ROUTES } from '@/lib/endpoints';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for authentication cookies
  const localToken = request.cookies.get('localToken')?.value;
  const remoteToken = request.cookies.get('remoteToken')?.value;
  const currentUserCookie = request.cookies.get('currentApiUser')?.value;
  
  // Parse current user if available
  let currentUser = null;
  let hasWriterTitlesRole = false;
  
  if (currentUserCookie) {
    try {
      currentUser = JSON.parse(decodeURIComponent(currentUserCookie));
      // Check if user has writer-titles role
      hasWriterTitlesRole = currentUser?.roles?.some((role: any) => role.name === 'writer-titles');
    } catch (e) {
      console.error('Failed to parse user cookie in middleware');
    }
  }

  // Protected routes
  const protectedRoutes = ['/users', '/dashboard', '/profile', '/theses', '/universities', '/reserved-titles', '/archive', '/manage-data'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // If accessing protected route without authentication, redirect to login
  if (isProtectedRoute) {
    // For writer-titles users, only remote token is required
    if (hasWriterTitlesRole) {
      if (!remoteToken) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
      }
    } else {
      // For other users, both tokens are required
      if (!localToken || !remoteToken) {
        return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
      }
    }
  }

  // If accessing login page while authenticated, redirect to dashboard
  if (request.nextUrl.pathname === ROUTES.LOGIN) {
    if (hasWriterTitlesRole && remoteToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (localToken && remoteToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};