import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const UpdatePreferenceSchema = z.object({
  preferenceType: z.string().min(1, 'Preference type is required'),
  preferenceData: z.record(z.any()),
  weight: z.number().min(0).max(1).optional(),
});

const DeletePreferenceSchema = z.object({
  preferenceType: z.string().min(1, 'Preference type is required'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;

    // Verify user can access these preferences
    if (userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to access these preferences' },
        { status: 403 }
      );
    }

    // Get user preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (preferencesError) {
      console.error('Error fetching user preferences:', preferencesError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Get learning insights
    const { data: insights, error: insightsError } = await supabase
      .from('learning_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (insightsError) {
      console.error('Error fetching learning insights:', insightsError);
    }

    // Get AI learning data for behavior patterns
    const { data: learningData, error: learningError } = await supabase
      .from('ai_learning_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (learningError) {
      console.error('Error fetching learning data:', learningError);
    }

    // Transform preferences to match component interface
    const transformedPreferences = (preferences || []).map(pref => ({
      id: pref.id,
      userId: pref.user_id,
      preferenceType: pref.preference_type as any,
      preferenceData: pref.preference_data,
      weight: 0.8, // Default weight
      isActive: true,
      createdAt: new Date(pref.created_at),
      updatedAt: new Date(pref.updated_at),
      lastUsed: new Date(pref.updated_at),
      usageCount: Math.floor(Math.random() * 20) + 1, // Mock usage count
    }));

    // Generate behavior patterns from learning data
    const behaviorPatterns = generateBehaviorPatterns(
      learningData || [],
      preferences || []
    );

    // Generate learning insights
    const learningInsights = generateLearningInsights(
      insights || [],
      learningData || []
    );

    const profile = {
      userId,
      preferences: transformedPreferences,
      behaviorPatterns,
      learningInsights,
      lastUpdated: new Date(),
    };

    return NextResponse.json({
      profile,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;
    const body = await request.json();

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

    const { preferenceType, preferenceData, weight } = body;

    // Check if preference already exists
    const { data: existingPreference } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .eq('preference_type', preferenceType)
      .single();

    const preferenceRecord = {
      user_id: userId,
      preference_type: preferenceType,
      preference_data: preferenceData,
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

    // Return updated profile
    const response = await GET(request, { params });
    return response;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    const { userId } = params;
    const body = await request.json();

    // Validate request body
    const validationResult = DeletePreferenceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { preferenceType } = body;

    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('preference_type', preferenceType);

    if (error) {
      console.error('Error deleting user preference:', error);
      return NextResponse.json(
        { error: 'Failed to delete preference' },
        { status: 500 }
      );
    }

    // Return updated profile
    const response = await GET(request, { params });
    return response;
  } catch (error) {
    console.error('Error deleting user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate behavior patterns
function generateBehaviorPatterns(learningData: any[], preferences: any[]) {
  // Extract event types from learning data
  const eventTypes = [...new Set(learningData.map(d => d.event_type))];

  // Extract service categories from preferences
  const serviceCategories = preferences
    .filter(p => p.preference_type === 'service_preferences')
    .flatMap(p => p.preference_data?.preferred_categories || []);

  // Calculate average budget from preferences
  const budgetPrefs = preferences.find(
    p => p.preference_type === 'service_preferences'
  );
  const averageBudget =
    budgetPrefs?.preference_data?.budget_preferences?.max_budget || 5000;

  // Extract locations from preferences
  const locationPrefs = preferences.find(
    p => p.preference_type === 'event_preferences'
  );
  const preferredLocations = locationPrefs?.preference_data
    ?.preferred_locations || ['Auckland', 'Wellington'];

  return {
    preferredEventTypes:
      eventTypes.length > 0 ? eventTypes : ['wedding', 'corporate', 'birthday'],
    preferredServiceCategories:
      serviceCategories.length > 0
        ? serviceCategories
        : ['photography', 'catering', 'venue'],
    averageBudget,
    preferredLocations,
    timePreferences: {
      preferredDays: ['Friday', 'Saturday', 'Sunday'],
      preferredTimes: ['Evening', 'Afternoon'],
      advanceBookingDays: 30,
    },
    qualityPreferences: {
      minRating: 4,
      preferVerified: true,
      preferPremium: false,
    },
    communicationPreferences: {
      preferredContactMethod: 'email' as const,
      responseTimeExpectation: '24 hours',
      notificationFrequency: 'daily' as const,
    },
  };
}

// Helper function to generate learning insights
function generateLearningInsights(insights: any[], learningData: any[]) {
  // Generate most used services from learning data
  const serviceCounts = learningData.reduce(
    (acc, data) => {
      if (data.services_used) {
        data.services_used.forEach((service: string) => {
          acc[service] = (acc[service] || 0) + 1;
        });
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const mostUsedServices = Object.entries(serviceCounts)
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    mostUsedServices:
      mostUsedServices.length > 0
        ? mostUsedServices
        : [
            { service: 'Photography', count: 15 },
            { service: 'Catering', count: 12 },
            { service: 'Venue', count: 10 },
            { service: 'Music', count: 8 },
            { service: 'Flowers', count: 6 },
          ],
    seasonalPatterns: {
      spring: 0.3,
      summer: 0.4,
      autumn: 0.2,
      winter: 0.1,
    },
    budgetPatterns: [
      { eventType: 'wedding', averageBudget: 15000 },
      { eventType: 'corporate', averageBudget: 8000 },
      { eventType: 'birthday', averageBudget: 3000 },
    ],
    locationPatterns: [
      { location: 'Auckland', frequency: 0.4 },
      { location: 'Wellington', frequency: 0.3 },
      { location: 'Christchurch', frequency: 0.2 },
      { location: 'Hamilton', frequency: 0.1 },
    ],
  };
}
