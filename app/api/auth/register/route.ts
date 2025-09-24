import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['event_manager', 'contractor', 'admin']),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is properly configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details:
            'Database connection not configured. Please contact support.',
          code: 'CONFIG_ERROR',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const { email, password, role, first_name, last_name } = validatedData;

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for development
      });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        {
          error: 'Failed to create user account',
          details: authError.message,
          code: authError.status || 'AUTH_ERROR',
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user record in our users table
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      role,
      is_verified: true, // Auto-verify for development
      last_login: new Date().toISOString(),
    });

    if (userError) {
      // Clean up auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: userError.message },
        { status: 500 }
      );
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name,
        last_name,
        timezone: 'Pacific/Auckland',
      });

    if (profileError) {
      console.error('Failed to create profile:', profileError);
      // Don't fail registration for profile creation error
    }

    // Create business profile if contractor
    if (role === 'contractor') {
      const { error: businessProfileError } = await supabaseAdmin
        .from('business_profiles')
        .insert({
          user_id: authData.user.id,
          company_name: `${first_name} ${last_name} Services`,
          subscription_tier: 'essential',
        });

      if (businessProfileError) {
        console.error(
          'Failed to create business profile:',
          businessProfileError
        );
        // Don't fail registration for business profile creation error
      }
    }

    // Generate session for the new user
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });

    if (sessionError) {
      console.error('Failed to generate session:', sessionError);
    }

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email,
        role,
        first_name,
        last_name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);

    // Check if it's a Supabase connection error
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: 'Unable to connect to the database. Please try again later.',
          code: 'DB_CONNECTION_ERROR',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
