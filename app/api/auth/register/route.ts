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
      return NextResponse.json(
        { error: 'Failed to create user account', details: authError.message },
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
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
