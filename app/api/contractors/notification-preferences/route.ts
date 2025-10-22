import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const notificationPreferencesSchema = z.object({
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  push_notifications: z.boolean(),
  job_alerts: z.boolean(),
  application_updates: z.boolean(),
  new_job_matches: z.boolean(),
  weekly_digest: z.boolean(),
  instant_alerts: z.boolean(),
});

// GET /api/contractors/notification-preferences - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('contractor_notification_preferences')
      .select('*')
      .eq('contractor_id', user.id)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') {
      throw new Error(
        `Failed to fetch notification preferences: ${preferencesError.message}`
      );
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      const defaultPreferences = {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        job_alerts: true,
        application_updates: true,
        new_job_matches: true,
        weekly_digest: true,
        instant_alerts: false,
      };

      return NextResponse.json({
        success: true,
        preferences: defaultPreferences,
      });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        email_notifications: preferences.email_notifications,
        sms_notifications: preferences.sms_notifications,
        push_notifications: preferences.push_notifications,
        job_alerts: preferences.job_alerts,
        application_updates: preferences.application_updates,
        new_job_matches: preferences.new_job_matches,
        weekly_digest: preferences.weekly_digest,
        instant_alerts: preferences.instant_alerts,
      },
    });
  } catch (error) {
    console.error(
      'GET /api/contractors/notification-preferences error:',
      error
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch notification preferences',
      },
      { status: 500 }
    );
  }
}

// PUT /api/contractors/notification-preferences - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = notificationPreferencesSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors:
            validationResult.error.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const preferences = validationResult.data;

    // Check if preferences exist
    const { data: existingPreferences } = await supabase
      .from('contractor_notification_preferences')
      .select('id')
      .eq('contractor_id', user.id)
      .single();

    let result;
    if (existingPreferences) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('contractor_notification_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('contractor_id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(
          `Failed to update notification preferences: ${error.message}`
        );
      }

      result = data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('contractor_notification_preferences')
        .insert({
          contractor_id: user.id,
          ...preferences,
        })
        .select()
        .single();

      if (error) {
        throw new Error(
          `Failed to create notification preferences: ${error.message}`
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      preferences: result,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error(
      'PUT /api/contractors/notification-preferences error:',
      error
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update notification preferences',
      },
      { status: 500 }
    );
  }
}
