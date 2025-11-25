import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  email_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  timezone: z.string().max(50, 'Timezone too long').optional(),
  language: z.string().max(10, 'Language code too long').optional(),
  show_on_homepage_map: z.boolean().optional(),
  publish_to_contractors: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Try to get userId from header first (preferred method)
    let userId = request.headers.get('x-user-id');

    // Fallback to middleware client if header not provided
    if (!userId) {
      const { supabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // Return default settings instead of error to allow form to load
        return NextResponse.json({
          settings: {
            email_notifications: true,
            sms_notifications: false,
            marketing_emails: false,
            timezone: 'Pacific/Auckland',
            language: 'en',
            show_on_homepage_map: false,
            publish_to_contractors: false,
          },
        });
      }
      userId = user.id;
    }

    // Get user settings from profiles table using service role client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('timezone, preferences')
      .eq('user_id', userId)
      .maybeSingle();

    // If profile not found or error, return default settings
    if (profileError || !profile) {
      return NextResponse.json({
        settings: {
          email_notifications: true,
          sms_notifications: false,
          marketing_emails: false,
          timezone: 'Pacific/Auckland',
          language: 'en',
          show_on_homepage_map: false,
          publish_to_contractors: false,
        },
      });
    }

    // Parse preferences JSON or use defaults
    const preferences = profile.preferences || {
      email_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      language: 'en',
      show_on_homepage_map: false,
      publish_to_contractors: false,
    };

    return NextResponse.json({
      settings: {
        ...preferences,
        timezone: profile.timezone || 'Pacific/Auckland',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/user/settings:', error);
    // Return default settings on error instead of failing
    return NextResponse.json({
      settings: {
        email_notifications: true,
        sms_notifications: false,
        marketing_emails: false,
        timezone: 'Pacific/Auckland',
        language: 'en',
        show_on_homepage_map: false,
        publish_to_contractors: false,
      },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try to get userId from header first (preferred method)
    let userId = request.headers.get('x-user-id');

    // Fallback to middleware client if header not provided
    if (!userId) {
      const { supabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Get current preferences using service role client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found', details: profileError?.message },
        { status: 404 }
      );
    }

    const currentPreferences = profile.preferences || {
      email_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      language: 'en',
      show_on_homepage_map: false,
      publish_to_contractors: false,
    };

    // Update preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...validatedData,
    };

    // Remove timezone from preferences as it's stored separately
    const { timezone, ...preferences } = updatedPreferences;

    const updateData: any = { preferences };
    if (timezone) {
      updateData.timezone = timezone;
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (updateError || !updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update settings', details: updateError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        ...(updatedProfile.preferences || {}),
        timezone: updatedProfile.timezone || 'Pacific/Auckland',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/user/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
