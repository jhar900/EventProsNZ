import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const UserPreferenceSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  preference_type: z.string(),
  preference_data: z.record(z.any()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const UpdatePreferenceSchema = z.object({
  preference_type: z.string().min(1, 'Preference type is required'),
  preference_data: z.record(z.any()),
});

// Default preference types and their schemas
const PREFERENCE_TYPES = {
  service_preferences: z.object({
    preferred_categories: z.array(z.string()).optional(),
    avoided_categories: z.array(z.string()).optional(),
    budget_preferences: z
      .object({
        min_budget: z.number().min(0).optional(),
        max_budget: z.number().min(0).optional(),
        budget_priority: z.enum(['low', 'medium', 'high']).optional(),
      })
      .optional(),
    quality_preferences: z
      .object({
        min_rating: z.number().min(1).max(5).optional(),
        verified_only: z.boolean().optional(),
        premium_preferred: z.boolean().optional(),
      })
      .optional(),
  }),
  event_preferences: z.object({
    preferred_event_types: z.array(z.string()).optional(),
    typical_attendee_count: z.number().min(1).optional(),
    typical_duration_hours: z.number().min(0.5).optional(),
    preferred_locations: z.array(z.string()).optional(),
    seasonal_preferences: z.array(z.string()).optional(),
  }),
  notification_preferences: z.object({
    email_notifications: z.boolean().optional(),
    push_notifications: z.boolean().optional(),
    sms_notifications: z.boolean().optional(),
    notification_frequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
    notification_types: z.array(z.string()).optional(),
  }),
  ui_preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    language: z.string().optional(),
    default_view: z.enum(['grid', 'list', 'map']).optional(),
    items_per_page: z.number().min(5).max(50).optional(),
    show_advanced_filters: z.boolean().optional(),
  }),
  learning_preferences: z.object({
    allow_data_collection: z.boolean().optional(),
    allow_personalization: z.boolean().optional(),
    allow_ab_testing: z.boolean().optional(),
    feedback_frequency: z.enum(['always', 'sometimes', 'never']).optional(),
  }),
};

export async function POST(request: NextRequest) {
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
    const { preference_type, preference_data } = body;

    // Validate required fields
    if (!preference_type || !preference_data) {
      return NextResponse.json(
        { error: 'Missing required fields: preference_type, preference_data' },
        { status: 400 }
      );
    }

    // Validate preference type and data
    const preferenceSchema =
      PREFERENCE_TYPES[preference_type as keyof typeof PREFERENCE_TYPES];
    if (!preferenceSchema) {
      return NextResponse.json(
        { error: 'Invalid preference type' },
        { status: 400 }
      );
    }

    const validationResult = preferenceSchema.safeParse(preference_data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid preference data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Create new preference
    const preference = {
      user_id: user.id,
      preference_type,
      preference_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .insert(preference);

    if (error) {
      console.error('Error creating user preference:', error);
      return NextResponse.json(
        { error: 'Failed to create user preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User preference created successfully',
      preference_id: data?.[0]?.id,
    });
  } catch (error) {
    console.error('Error processing user preference creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || user.id;
    const preferenceType = searchParams.get('preference_type');

    // Verify user can access these preferences
    if (userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to access these preferences' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);

    if (preferenceType) {
      query = query.eq('preference_type', preferenceType);
    }

    const { data: preferences, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching user preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // If no preferences exist, return default preferences
    if (!preferences || preferences.length === 0) {
      const defaultPreferences = getDefaultPreferences(userId);
      return NextResponse.json({
        preferences: defaultPreferences,
        metadata: {
          user_id: userId,
          total_preferences: defaultPreferences.length,
          is_default: true,
        },
      });
    }

    return NextResponse.json({
      preferences,
      metadata: {
        user_id: userId,
        total_preferences: preferences.length,
        preference_types: [...new Set(preferences.map(p => p.preference_type))],
      },
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
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
    const { preference_type, preference_data } = body;

    // Validate request body
    const validationResult = UpdatePreferenceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Validate preference data based on type
    const typeSchema =
      PREFERENCE_TYPES[preference_type as keyof typeof PREFERENCE_TYPES];
    if (typeSchema) {
      const dataValidation = typeSchema.safeParse(preference_data);
      if (!dataValidation.success) {
        return NextResponse.json(
          {
            error: 'Invalid preference data',
            details: dataValidation.error.errors,
          },
          { status: 400 }
        );
      }
    }

    // Check if preference already exists
    const { data: existingPreference } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .eq('preference_type', preference_type)
      .single();

    const preferenceRecord = {
      user_id: user.id,
      preference_type,
      preference_data,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingPreference) {
      // Update existing preference
      const { data, error } = await supabase
        .from('user_preferences')
        .update(preferenceRecord)
        .eq('id', existingPreference.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user preference:', error);
        return NextResponse.json(
          { error: 'Failed to update preference' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new preference
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          ...preferenceRecord,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user preference:', error);
        return NextResponse.json(
          { error: 'Failed to create preference' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({
      preference: result,
      success: true,
      message: 'Preference updated successfully',
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const preferenceType = searchParams.get('preference_type');

    if (!preferenceType) {
      return NextResponse.json(
        { error: 'Preference type is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('preference_type', preferenceType);

    if (error) {
      console.error('Error deleting user preference:', error);
      return NextResponse.json(
        { error: 'Failed to delete preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preference deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get default preferences
function getDefaultPreferences(userId: string) {
  const now = new Date().toISOString();

  return [
    {
      id: `default_service_${userId}`,
      user_id: userId,
      preference_type: 'service_preferences',
      preference_data: {
        budget_preferences: {
          budget_priority: 'medium',
        },
        quality_preferences: {
          min_rating: 3,
          verified_only: false,
          premium_preferred: false,
        },
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: `default_event_${userId}`,
      user_id: userId,
      preference_type: 'event_preferences',
      preference_data: {
        typical_attendee_count: 50,
        typical_duration_hours: 4,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: `default_notification_${userId}`,
      user_id: userId,
      preference_type: 'notification_preferences',
      preference_data: {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        notification_frequency: 'daily',
        notification_types: ['recommendations', 'updates', 'reminders'],
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: `default_ui_${userId}`,
      user_id: userId,
      preference_type: 'ui_preferences',
      preference_data: {
        theme: 'auto',
        language: 'en',
        default_view: 'grid',
        items_per_page: 20,
        show_advanced_filters: false,
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: `default_learning_${userId}`,
      user_id: userId,
      preference_type: 'learning_preferences',
      preference_data: {
        allow_data_collection: true,
        allow_personalization: true,
        allow_ab_testing: true,
        feedback_frequency: 'sometimes',
      },
      created_at: now,
      updated_at: now,
    },
  ];
}
