import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSettingsSchema = z.object({
  email_notifications: z.boolean().optional(),
  sms_notifications: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  timezone: z.string().max(50, 'Timezone too long').optional(),
  language: z.string().max(10, 'Language code too long').optional(),
  show_on_homepage_map: z.boolean().optional(),
  publish_to_contractors: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;

    // Get user settings from profiles table using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('timezone, preferences')
      .eq('user_id', userId)
      .maybeSingle();

    // Get business profile to check is_published and publish_address status
    const { data: businessProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('is_published, publish_address')
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
          show_on_homepage_map: businessProfile?.publish_address ?? false,
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
    const publishToContractors =
      businessProfile?.is_published ??
      preferences.publish_to_contractors ??
      false;

    // Use business_profiles.publish_address as the source of truth for show_on_homepage_map
    const showOnHomepageMap =
      businessProfile?.publish_address ??
      preferences.show_on_homepage_map ??
      false;

    return NextResponse.json({
      settings: {
        ...preferences,
        publish_to_contractors: publishToContractors,
        show_on_homepage_map: showOnHomepageMap,
        timezone: profile.timezone || 'Pacific/Auckland',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[userId]/settings:', error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Get current preferences using admin client
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

    // Check if business profile exists
    const { data: existingBusinessProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('id, is_published, publish_address')
      .eq('user_id', userId)
      .maybeSingle();

    // Prepare business profile update data
    const businessProfileUpdate: any = {
      updated_at: new Date().toISOString(),
    };

    // Sync publish_to_contractors preference to business_profiles.is_published
    if (validatedData.publish_to_contractors !== undefined) {
      const isPublished = Boolean(validatedData.publish_to_contractors);
      businessProfileUpdate.is_published = isPublished;
    }

    // Sync show_on_homepage_map preference to business_profiles.publish_address
    if (validatedData.show_on_homepage_map !== undefined) {
      const publishAddress = Boolean(validatedData.show_on_homepage_map);
      businessProfileUpdate.publish_address = publishAddress;
    }

    // Update business profile if there are changes
    if (
      existingBusinessProfile &&
      Object.keys(businessProfileUpdate).length > 1
    ) {
      // More than just updated_at
      await supabaseAdmin
        .from('business_profiles')
        .update(businessProfileUpdate)
        .eq('user_id', userId);
    }

    // Get the actual values from business_profiles to return accurate state
    const { data: businessProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('is_published, publish_address')
      .eq('user_id', userId)
      .maybeSingle();

    // Use business_profiles values as the source of truth for the response
    const publishToContractors =
      businessProfile?.is_published ??
      updatedProfile.preferences?.publish_to_contractors ??
      false;

    const showOnHomepageMap =
      businessProfile?.publish_address ??
      updatedProfile.preferences?.show_on_homepage_map ??
      false;

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        ...(updatedProfile.preferences || {}),
        publish_to_contractors: publishToContractors,
        show_on_homepage_map: showOnHomepageMap,
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

    console.error('Error in PUT /api/admin/users/[userId]/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
