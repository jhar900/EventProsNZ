import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  email_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  timezone: z.string().max(50, 'Timezone too long').optional(),
  language: z.string().max(10, 'Language code too long').optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user settings from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('timezone, preferences')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Settings not found', details: profileError.message },
        { status: 404 }
      );
    }

    // Parse preferences JSON or use defaults
    const preferences = profile.preferences || {
      email_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      language: 'en',
    };

    return NextResponse.json({
      settings: {
        ...preferences,
        timezone: profile.timezone || 'Pacific/Auckland',
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Get current preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found', details: profileError.message },
        { status: 404 }
      );
    }

    const currentPreferences = profile.preferences || {
      email_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      language: 'en',
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

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update settings', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        ...updatedProfile.preferences,
        timezone: updatedProfile.timezone,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
