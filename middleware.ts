import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle the missing CSS file issue
  if (request.nextUrl.pathname.includes('default-stylesheet.css')) {
    return new NextResponse(
      '/* Default stylesheet for Next.js build process */',
      {
        headers: {
          'Content-Type': 'text/css',
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
