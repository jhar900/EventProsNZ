import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Sign out the user server-side
    await supabase.auth.signOut();

    // Build response and explicitly clear all Supabase auth cookies
    const jsonResponse = NextResponse.json({
      message: 'Logged out successfully',
    });

    // Clear all Supabase auth cookies from the browser
    // Supabase SSR uses chunked cookies: sb-<ref>-auth-token, sb-<ref>-auth-token.0, .1, etc.
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.includes('auth-token') || cookie.name.includes('sb-')) {
        jsonResponse.cookies.set(cookie.name, '', {
          path: '/',
          maxAge: 0,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
    });

    return jsonResponse;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
