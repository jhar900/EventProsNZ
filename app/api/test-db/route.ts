import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Test direct database connection with service role
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_verified')
      .limit(5);

    // Test environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl:
        process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    };

    return NextResponse.json({
      environment: envCheck,
      directDatabaseTest: {
        users: users || [],
        error: usersError?.message,
        count: users?.length || 0,
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
