import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { z } from 'zod';

const privacySettingsSchema = z.object({
  profile_visibility: z
    .enum(['public', 'contacts_only', 'private'])
    .default('public'),
  contact_visibility: z
    .enum(['public', 'contacts_only', 'private'])
    .default('public'),
  portfolio_visibility: z
    .enum(['public', 'contacts_only', 'private'])
    .default('public'),
  business_visibility: z
    .enum(['public', 'contacts_only', 'private'])
    .default('public'),
});

export async function GET(request: NextRequest) {
  try {
    // Try to get user ID from header first
    let userId = request.headers.get('x-user-id');

    // If no header, try cookie-based auth
    if (!userId) {
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

      userId = user.id;
    }

    const { supabase } = createClient(request);

    // Get privacy settings from user preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const privacySettings = profile.preferences?.privacy || {
      profile_visibility: 'public',
      contact_visibility: 'public',
      portfolio_visibility: 'public',
      business_visibility: 'public',
    };

    return NextResponse.json({ privacy_settings: privacySettings });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try to get user ID from header first
    let userId = request.headers.get('x-user-id');

    // If no header, try cookie-based auth
    if (!userId) {
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

      userId = user.id;
    }

    const { supabase } = createClient(request);

    const body = await request.json();
    const validatedData = privacySettingsSchema.parse(body);

    // Update privacy settings in user preferences
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        preferences: {
          privacy: validatedData,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update privacy settings' },
        { status: 400 }
      );
    }

    return NextResponse.json({ privacy_settings: validatedData });
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
