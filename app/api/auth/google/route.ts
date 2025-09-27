import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const googleAuthSchema = z.object({
  id_token: z.string().min(1, 'ID token is required'),
  role: z.enum(['event_manager', 'contractor']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = googleAuthSchema.parse(body);

    const { id_token, role = 'event_manager' } = validatedData;

    // Verify and create user with Google ID token
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      });

    if (authError) {
      return NextResponse.json(
        { error: 'Google authentication failed', details: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Check if user already exists in our database
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, is_verified')
      .eq('id', authData.user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      return NextResponse.json(
        { error: 'Failed to check user status' },
        { status: 500 }
      );
    }

    if (existingUser) {
      // User exists, update last login and return user data
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

      // Get full user profile
      const { data: userData, error: profileError } = await supabaseAdmin
        .from('users')
        .select(
          `
          id,
          email,
          role,
          is_verified,
          last_login,
          profiles (
            first_name,
            last_name,
            avatar_url,
            timezone
          )
        `
        )
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to fetch user profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Login successful',
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          is_verified: userData.is_verified,
          last_login: userData.last_login,
          profile: userData.profiles,
        },
        session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token,
          expires_at: authData.session?.expires_at,
        },
      });
    }

    // New user - create user record
    const { error: createUserError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        role,
        is_verified: true, // Google users are pre-verified
        last_login: new Date().toISOString(),
      });

    if (createUserError) {
      return NextResponse.json(
        {
          error: 'Failed to create user profile',
          details: createUserError.message,
        },
        { status: 500 }
      );
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name:
          authData.user.user_metadata?.full_name?.split(' ')[0] || 'User',
        last_name:
          authData.user.user_metadata?.full_name
            ?.split(' ')
            .slice(1)
            .join(' ') || '',
        avatar_url: authData.user.user_metadata?.avatar_url,
        timezone: 'Pacific/Auckland',
      });

    if (profileError) {
      // Don't fail registration for profile creation error
    }

    // Create business profile if contractor
    if (role === 'contractor') {
      const { error: businessProfileError } = await supabaseAdmin
        .from('business_profiles')
        .insert({
          user_id: authData.user.id,
          company_name: `${authData.user.user_metadata?.full_name || 'User'} Services`,
          subscription_tier: 'essential',
        });

      if (businessProfileError) {
        // Don't fail registration for business profile creation error
      }
    }

    return NextResponse.json({
      message: 'User registered and logged in successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
        is_verified: true,
        last_login: new Date().toISOString(),
        profile: {
          first_name:
            authData.user.user_metadata?.full_name?.split(' ')[0] || 'User',
          last_name:
            authData.user.user_metadata?.full_name
              ?.split(' ')
              .slice(1)
              .join(' ') || '',
          avatar_url: authData.user.user_metadata?.avatar_url,
          timezone: 'Pacific/Auckland',
        },
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
