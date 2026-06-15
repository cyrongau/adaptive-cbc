import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'cbc_jwt_secret_key_2024_adaptive');

const AUTH_LEVEL_HIERARCHY: Record<string, number> = {
  student: 1,
  parent: 2,
  teacher: 3,
  tutor: 3,
  institution_admin: 4,
  super_admin: 5,
};

const ROLE_ROUTES: Record<string, string[]> = {
  student: [
    '/dashboard', '/course-hub', '/classes', '/schedule', '/practice',
    '/assignments', '/question-bank', '/school', '/library', '/store',
    '/materials', '/progress', '/leaderboard', '/chat', '/support',
    '/settings', '/profile', '/children',
  ],
  parent: [
    '/dashboard', '/course-hub', '/children', '/store', '/library',
    '/progress', '/chat', '/support', '/settings', '/profile',
    '/approvals',
  ],
  teacher: [
    '/dashboard', '/course-hub', '/my-courses', '/students', '/classes',
    '/sessions', '/assignments', '/school', '/schedule', '/financial-hub', '/store',
    '/library', '/author-studio', '/materials', '/progress', '/chat',
    '/support', '/settings', '/profile',
  ],
  tutor: [
    '/dashboard', '/course-hub', '/my-courses', '/students', '/sessions',
    '/kyc', '/financial-hub', '/store', '/progress', '/author-studio',
    '/materials', '/schedule', '/chat', '/support', '/settings', '/profile',
  ],
  institution_admin: [
    '/dashboard', '/institution', '/students', '/teachers', '/author-studio',
    '/library', '/store', '/analytics', '/reports', '/chat', '/support',
    '/settings', '/profile',
  ],
  super_admin: [
    '/dashboard', '/users', '/kyc-applications', '/verification',
    '/institutions', '/financial', '/store', '/content', '/analytics',
    '/reports', '/chat', '/support', '/settings', '/profile',
  ],
};

function getBasePath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  if (segments[0] === 'admin' && segments.length >= 2) {
    return '/admin/' + segments[1];
  }
  return '/' + segments[0];
}

const PUBLIC_ROUTES = [
  '/',
  '/courses',
  '/login', '/register', '/forgot-password', '/reset-password',
  '/verify-otp', '/verify-2fa', '/admin-login', '/account-recovery',
  '/device-approval',
];

const ADMIN_PREFIXES = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('--- MIDDLEWARE PATH:', pathname);

  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/'),
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    loginUrl.searchParams.set('authRequired', 'true');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(accessToken, JWT_SECRET);
    const role = payload.role as string;
    const userAuthLevel = AUTH_LEVEL_HIERARCHY[role] || 0;

    if (userAuthLevel === 0) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isAdminPath = ADMIN_PREFIXES.some(prefix => pathname.startsWith(prefix));

    if (isAdminPath) {
      if (userAuthLevel < 4) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    const basePath = getBasePath(pathname);
    const allowedRoutes = ROLE_ROUTES[role] || ROLE_ROUTES['student'];

    const isAllowed = allowedRoutes.some(route =>
      pathname === route || pathname.startsWith(route + '/'),
    );

    if (!isAllowed) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    loginUrl.searchParams.set('authRequired', 'true');
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!api|socket.io|_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
