import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get all headers
    const headers = Object.fromEntries(request.headers.entries());

    // Get user email from header
    const userEmail = request.headers.get('x-user-email');

    // Test database query
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_verified')
      .limit(5);

    // Test specific admin user query
    let adminUser = null;
    let adminError = null;
    if (userEmail) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, role, is_verified, last_login')
        .eq('email', userEmail)
        .eq('role', 'admin')
        .single();

      adminUser = data;
      adminError = error;
    }

    return NextResponse.json({
      headers: headers,
      userEmail: userEmail,
      allUsers: allUsers || [],
      allUsersError: allUsersError?.message,
      adminUser: adminUser,
      adminError: adminError?.message,
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
