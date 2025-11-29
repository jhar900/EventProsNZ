import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get current user - use getSession() first to avoid refresh token errors
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    let user = session?.user;

    // If no session, try getUser (but handle refresh token errors)
    if (!user) {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      // Handle refresh token errors gracefully
      if (authError) {
        if (
          authError.message?.includes('refresh_token_not_found') ||
          authError.message?.includes('Invalid Refresh Token') ||
          authError.message?.includes('Refresh Token Not Found')
        ) {
          return NextResponse.json(
            {
              error: 'Session expired. Please log in again.',
              code: 'SESSION_EXPIRED',
            },
            { status: 401 }
          );
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      user = getUserUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get business profile if exists
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: profile.role,
        is_verified: profile.is_verified,
        created_at: user.created_at,
      },
      profile,
      business_profile: businessProfile || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get current user - use getSession() first to avoid refresh token errors
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    let user = session?.user;

    // If no session, try getUser (but handle refresh token errors)
    if (!user) {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      // Handle refresh token errors gracefully
      if (authError) {
        if (
          authError.message?.includes('refresh_token_not_found') ||
          authError.message?.includes('Invalid Refresh Token') ||
          authError.message?.includes('Refresh Token Not Found')
        ) {
          return NextResponse.json(
            {
              error: 'Session expired. Please log in again.',
              code: 'SESSION_EXPIRED',
            },
            { status: 401 }
          );
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      user = getUserUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 400 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
