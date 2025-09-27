import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;
    // Authenticate user with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return NextResponse.json(
        { error: 'Invalid credentials', details: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get user profile from our database
    const { data: userData, error: userError } = await supabaseAdmin
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

    if (userError) {
      // If user exists in Auth but not in our database, create the record
      if (
        userError.code === 'PGRST116' ||
        userError.message.includes('No rows found') ||
        userError.message.includes('relation') ||
        userError.message.includes('does not exist')
      ) {
        // Create user record in our database
        const { error: createUserError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            role: 'event_manager', // Default role
            is_verified: true,
            last_login: new Date().toISOString(),
          });

        if (createUserError) {
          // Check if it's a duplicate key error (user already exists)
          if (
            createUserError.code === '23505' ||
            createUserError.message.includes('duplicate key')
          ) {
            // Continue with the login process even if user creation failed
          } else {
            return NextResponse.json(
              {
                error: 'Failed to create user profile',
                details: createUserError.message,
                code: createUserError.code,
              },
              { status: 500 }
            );
          }
        }

        // Create profile record (only if user creation succeeded or was duplicate)
        const { error: createProfileError } = await supabaseAdmin
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
            timezone: 'Pacific/Auckland',
          });

        if (createProfileError) {
          // Check if it's a duplicate key error (profile already exists)
          if (
            createProfileError.code === '23505' ||
            createProfileError.message.includes('duplicate key')
          ) {
            } else {
            // Don't fail login for profile creation error, but log it
          }
        }

        // Retry fetching the user profile
        const { data: retryUserData, error: retryUserError } =
          await supabaseAdmin
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

        if (retryUserError) {
          // Fallback: return basic user data from Auth if database fetch fails
          return NextResponse.json({
            message: 'Login successful (fallback mode)',
            user: {
              id: authData.user.id,
              email: authData.user.email,
              role: 'event_manager', // Default role
              is_verified: true,
              last_login: new Date().toISOString(),
              profile: {
                first_name:
                  authData.user.user_metadata?.full_name?.split(' ')[0] ||
                  'User',
                last_name:
                  authData.user.user_metadata?.full_name
                    ?.split(' ')
                    .slice(1)
                    .join(' ') || '',
                timezone: 'Pacific/Auckland',
              },
              business_profile: null,
            },
            session: authData.session,
          });
        }

        // Use the retry data for the rest of the function
        const userData = retryUserData;

        // Get business profile if contractor
        let businessProfile = null;
        if (userData.role === 'contractor') {
          const { data: businessData } = await supabaseAdmin
            .from('business_profiles')
            .select('id, company_name, subscription_tier, is_verified')
            .eq('user_id', authData.user.id)
            .single();

          businessProfile = businessData;
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
            business_profile: businessProfile,
          },
          session: authData.session,
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: userError.message },
        { status: 500 }
      );
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    // Get business profile if contractor
    let businessProfile = null;
    if (userData.role === 'contractor') {
      const { data: businessData } = await supabaseAdmin
        .from('business_profiles')
        .select('id, company_name, subscription_tier, is_verified')
        .eq('user_id', authData.user.id)
        .single();

      businessProfile = businessData;
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
        business_profile: businessProfile,
      },
      session: authData.session,
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
