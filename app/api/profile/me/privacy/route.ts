import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get privacy settings from user preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('user_id', user.id)
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
    console.error('Error fetching privacy settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      .eq('user_id', user.id)
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
    console.error('Error updating privacy settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
