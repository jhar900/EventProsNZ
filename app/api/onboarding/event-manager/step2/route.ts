import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const step2Schema = z.object({
  role_type: z.enum(['personal', 'business'], {
    required_error: 'Role type is required',
    invalid_type_error: 'Role type must be either "personal" or "business"',
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Create Supabase client with service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Validate request body
    const body = await request.json();
    const validatedData = step2Schema.parse(body);

    // First, check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profile not found. Please complete step 1 first.' },
        { status: 404 }
      );
    }

    // Prepare update data with preferences
    // Preserve existing preferences and merge in role_type
    const currentPreferences = (existingProfile.preferences as any) || {};
    const updatedPreferences = {
      ...currentPreferences,
      role_type: validatedData.role_type,
    };

    // Update profile with preferences
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Error updating profile:', updateError);

      // If the error is about preferences column not existing, provide helpful message
      if (
        updateError.message?.includes('preferences') ||
        updateError.message?.includes('column')
      ) {
        return NextResponse.json(
          {
            error:
              'Preferences column not found. Please run the migration to add it.',
            details:
              'Run: supabase/migrations/20250116_add_preferences_to_profiles.sql',
            migration_needed: true,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to update profile preferences',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Determine next step based on role type
    const nextStep =
      validatedData.role_type === 'business' ? 'step3' : 'complete';

    return NextResponse.json({
      success: true,
      next_step: nextStep,
      role_type: validatedData.role_type,
      message: 'Role type saved successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
