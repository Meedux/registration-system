import { NextResponse } from 'next/server';

// Admin-only routes
const adminRoutes = ['/admin', '/setup-admin'];

// User-only routes (admins should not access these)
const userOnlyRoutes = ['/registration', '/survey', '/member'];

// Auth routes
const authRoutes = ['/auth/login', '/auth/register', '/auth/verify-email'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and auth callbacks
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get user data from cookies
  const isAdmin = request.cookies.get('isAdmin')?.value === 'true';
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';

  console.log(`Middleware - Path: ${pathname}, IsAdmin: ${isAdmin}, IsAuth: ${isAuthenticated}`);
  console.log('All cookies:', Object.fromEntries(request.cookies.getAll().map(cookie => [cookie.name, cookie.value])));

  // Handle admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      console.log('Redirecting unauthenticated user from admin route to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    if (!isAdmin) {
      console.log('Redirecting non-admin user from admin route to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Admin accessing admin route - allow
    console.log('Allowing admin access to admin route');
    return NextResponse.next();
  }

  // Handle user-only routes
  if (userOnlyRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      console.log('Redirecting unauthenticated user from user route to login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    if (isAdmin) {
      console.log('Redirecting admin user from user route to admin');
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Regular user accessing user route - allow
    console.log('Allowing regular user access to user route');
    return NextResponse.next();
  }

  // Handle home page for authenticated users
  if (pathname === '/' && isAuthenticated && isAdmin) {
    console.log('Redirecting admin from home to admin panel');
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Allow all other routes (home, auth, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
