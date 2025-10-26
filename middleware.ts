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

  // Handle Supabase Auth for all other routes
  const { supabase, response } = createClient(request);

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser();

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
