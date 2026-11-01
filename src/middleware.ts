import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Handle common mistyped / nested admin URLs
  if (pathname === '/register/admission/admin' || pathname.startsWith('/register/admission/admin/')) {
    return NextResponse.redirect(new URL('/admin/admissions', req.url));
  }
  if (pathname === '/register/admissions/admin' || pathname.startsWith('/register/admissions/admin/')) {
    return NextResponse.redirect(new URL('/admin/admissions', req.url));
  }
  if (pathname === '/admission/admin' || pathname.startsWith('/admission/admin/')) {
    return NextResponse.redirect(new URL('/admin/admissions', req.url));
  }
  if (pathname === '/register/belt-exam/admin' || pathname.startsWith('/register/belt-exam/admin/')) {
    return NextResponse.redirect(new URL('/admin/exams', req.url));
  }
  if (pathname === '/register/competition/admin' || pathname.startsWith('/register/competition/admin/')) {
    return NextResponse.redirect(new URL('/admin/competitions', req.url));
  }
  if (pathname === '/register/seminar/admin' || pathname.startsWith('/register/seminar/admin/')) {
    return NextResponse.redirect(new URL('/admin/seminars', req.url));
  }
  if (pathname === '/register/admin' || (pathname.endsWith('/admin') && pathname !== '/admin')) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // Only protect /admin routes
  if (pathname.startsWith('/admin')) {
    const basicAuth = req.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, pwd] = atob(authValue).split(':');

      // Check credentials against the requested ones
      if (user === 'admin' && pwd === 'karateadmin123') {
        return NextResponse.next();
      }
    }

    // Prompt for Basic Auth
    return new NextResponse('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Panel Login"',
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/register/:path*'],
};
