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

    // Get business profile to check is_published status
    const { data: businessProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('is_published')
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
          publish_to_contractors: businessProfile?.is_published ?? false,
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

    // Use business_profiles.is_published as the source of truth for publish_to_contractors
    // This ensures the checkbox reflects the actual database state
    const publishToContractors =
      businessProfile?.is_published ??
      preferences.publish_to_contractors ??
      false;

    return NextResponse.json({
      settings: {
        ...preferences,
        publish_to_contractors: publishToContractors,
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
  console.log('PUT /api/user/settings: Request received');
  try {
    // Try to get userId from header first (preferred method)
    let userId = request.headers.get('x-user-id');
    console.log('PUT /api/user/settings: userId from header:', userId);

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
    console.log('PUT /api/user/settings: Request body:', body);
    const validatedData = updateSettingsSchema.parse(body);
    console.log('PUT /api/user/settings: Validated data:', validatedData);
    console.log(
      'PUT /api/user/settings: publish_to_contractors:',
      validatedData.publish_to_contractors
    );

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

    // Sync publish_to_contractors preference to business_profiles.is_published
    if (validatedData.publish_to_contractors !== undefined) {
      // Ensure boolean value
      const isPublished = Boolean(validatedData.publish_to_contractors);

      console.log(
        `Updating business_profiles.is_published for user ${userId} to ${isPublished}`
      );

      // Check if business profile exists
      const { data: existingBusinessProfile, error: checkError } =
        await supabaseAdmin
          .from('business_profiles')
          .select('id, is_published')
          .eq('user_id', userId)
          .maybeSingle();

      if (checkError) {
        console.error('Error checking business profile:', checkError);
      }

      if (existingBusinessProfile) {
        const { data: updatedBusinessProfile, error: businessProfileError } =
          await supabaseAdmin
            .from('business_profiles')
            .update({
              is_published: isPublished,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select('is_published')
            .single();

        if (businessProfileError) {
          // Log error but don't fail the request
          console.error(
            'Failed to update business_profiles.is_published:',
            businessProfileError
          );
        } else {
          console.log(
            `Successfully updated business_profiles.is_published to ${updatedBusinessProfile?.is_published}`
          );
        }
      } else {
        console.warn(
          `Business profile not found for user ${userId}, cannot update is_published`
        );
      }
    }

    // Get the actual is_published value from business_profiles to return accurate state
    // This ensures we return the actual database value, not just what we tried to set
    const { data: businessProfile, error: fetchError } = await supabaseAdmin
      .from('business_profiles')
      .select('is_published')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error(
        'Error fetching business profile after update:',
        fetchError
      );
    }

    // Use business_profiles.is_published as the source of truth for the response
    const publishToContractors =
      businessProfile?.is_published ??
      updatedProfile.preferences?.publish_to_contractors ??
      false;

    console.log(
      `Final publish_to_contractors value for response: ${publishToContractors}`
    );

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        ...(updatedProfile.preferences || {}),
        publish_to_contractors: publishToContractors,
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
