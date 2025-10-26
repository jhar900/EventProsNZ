import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get environment info
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      url: request.url,
      hostname: new URL(request.url).hostname,
      isLocalhost: request.url.includes('localhost'),
    };

    // Try to get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let userInfo = null;
    if (user) {
      // Get user role from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, is_verified, last_login')
        .eq('id', user.id)
        .single();

      userInfo = {
        id: user.id,
        email: user.email,
        role: userData?.role,
        is_verified: userData?.is_verified,
        last_login: userData?.last_login,
        error: userError?.message,
      };
    }

    // Try to get users count
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      environment: envInfo,
      auth: {
        user: userInfo,
        authError: authError?.message,
      },
      database: {
        usersCount: count,
        countError: countError?.message,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
