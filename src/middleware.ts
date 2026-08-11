import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Only protect /admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
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
  matcher: ['/admin/:path*'],
};
