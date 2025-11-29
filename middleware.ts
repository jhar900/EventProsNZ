import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
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

  // Skip auth for static assets and API routes (they handle their own auth)
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i)
  ) {
    return NextResponse.next();
  }

  // Handle Supabase Auth for other routes
  const { supabase, response } = createClient(request);

  // Check session without auto-refreshing to avoid refresh_token_not_found errors
  // getSession() doesn't auto-refresh, so it won't throw errors for missing refresh tokens
  // This is sufficient for middleware - we just need to ensure cookies are handled properly
  // The actual auth check happens in API routes and components that need it
  // We don't await this - it's fire-and-forget to avoid blocking the request
  supabase.auth.getSession().catch(() => {
    // Silently fail - session check is not critical for navigation
    // This won't throw refresh_token_not_found errors since getSession doesn't auto-refresh
    // Errors are caught to prevent them from appearing in server logs
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)',
  ],
};
