import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiCache } from '@/lib/ai/cache';
import { z } from 'zod';

// Validation schemas
const ServiceRecommendationRequestSchema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
  user_id: z.string().uuid().optional(),
  preferences: z.record(z.any()).optional(),
  attendee_count: z.number().min(1).optional(),
  budget: z.number().min(0).optional(),
  location: z.string().optional(),
  event_date: z.string().datetime().optional(),
});

const ServiceRecommendationSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  service_category: z.string(),
  service_name: z.string(),
  priority: z.number().min(1).max(5),
  confidence_score: z.number().min(0).max(1),
  is_required: z.boolean(),
  description: z.string().optional(),
  estimated_cost: z.number().optional(),
  created_at: z.string().datetime(),
});

// Event type to service category mapping
const EVENT_TYPE_SERVICE_MAPPING = {
  wedding: [
    { category: 'Photography', priority: 5, confidence: 0.95, required: true },
    { category: 'Catering', priority: 5, confidence: 0.95, required: true },
    { category: 'Venue', priority: 5, confidence: 0.95, required: true },
    { category: 'Music/DJ', priority: 4, confidence: 0.9, required: true },
    { category: 'Flowers', priority: 4, confidence: 0.85, required: true },
    {
      category: 'Wedding Planner',
      priority: 3,
      confidence: 0.8,
      required: false,
    },
    {
      category: 'Transportation',
      priority: 3,
      confidence: 0.75,
      required: false,
    },
    {
      category: 'Hair & Makeup',
      priority: 4,
      confidence: 0.85,
      required: true,
    },
    { category: 'Wedding Cake', priority: 3, confidence: 0.8, required: true },
    { category: 'Decorations', priority: 3, confidence: 0.75, required: false },
  ],
  corporate: [
    { category: 'Venue', priority: 5, confidence: 0.95, required: true },
    { category: 'Catering', priority: 4, confidence: 0.9, required: true },
    { category: 'AV Equipment', priority: 4, confidence: 0.85, required: true },
    {
      category: 'Event Management',
      priority: 4,
      confidence: 0.9,
      required: true,
    },
    { category: 'Photography', priority: 3, confidence: 0.75, required: false },
    {
      category: 'Transportation',
      priority: 2,
      confidence: 0.6,
      required: false,
    },
    { category: 'Security', priority: 3, confidence: 0.7, required: false },
    { category: 'Networking', priority: 2, confidence: 0.65, required: false },
  ],
  birthday: [
    { category: 'Venue', priority: 4, confidence: 0.85, required: true },
    { category: 'Catering', priority: 4, confidence: 0.9, required: true },
    {
      category: 'Entertainment',
      priority: 4,
      confidence: 0.85,
      required: true,
    },
    { category: 'Decorations', priority: 3, confidence: 0.8, required: true },
    { category: 'Photography', priority: 3, confidence: 0.75, required: false },
    { category: 'Party Favors', priority: 2, confidence: 0.6, required: false },
    { category: 'Cake', priority: 4, confidence: 0.85, required: true },
  ],
  conference: [
    { category: 'Venue', priority: 5, confidence: 0.95, required: true },
    { category: 'AV Equipment', priority: 5, confidence: 0.95, required: true },
    { category: 'Catering', priority: 4, confidence: 0.9, required: true },
    {
      category: 'Event Management',
      priority: 4,
      confidence: 0.9,
      required: true,
    },
    { category: 'Registration', priority: 4, confidence: 0.85, required: true },
    { category: 'Networking', priority: 3, confidence: 0.75, required: false },
    {
      category: 'Transportation',
      priority: 2,
      confidence: 0.6,
      required: false,
    },
    { category: 'Security', priority: 3, confidence: 0.7, required: false },
  ],
  party: [
    { category: 'Venue', priority: 4, confidence: 0.85, required: true },
    { category: 'Catering', priority: 4, confidence: 0.9, required: true },
    { category: 'Music/DJ', priority: 4, confidence: 0.85, required: true },
    { category: 'Decorations', priority: 3, confidence: 0.8, required: true },
    { category: 'Photography', priority: 2, confidence: 0.65, required: false },
    {
      category: 'Entertainment',
      priority: 3,
      confidence: 0.75,
      required: false,
    },
    { category: 'Party Favors', priority: 2, confidence: 0.6, required: false },
  ],
};

// Industry best practices
const INDUSTRY_BEST_PRACTICES = {
  wedding: {
    budget_allocation: {
      venue: 0.4,
      catering: 0.3,
      photography: 0.15,
      music: 0.05,
      flowers: 0.05,
      other: 0.05,
    },
    timeline: {
      planning_start: 12, // months before
      venue_booking: 9,
      vendor_booking: 6,
      final_details: 1,
    },
  },
  corporate: {
    budget_allocation: {
      venue: 0.35,
      catering: 0.25,
      av_equipment: 0.15,
      event_management: 0.15,
      other: 0.1,
    },
    timeline: {
      planning_start: 6, // months before
      venue_booking: 4,
      vendor_booking: 3,
      final_details: 2,
    },
  },
};

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
    const eventType = searchParams.get('event_type');
    const userId = searchParams.get('user_id') || user.id;
    const attendeeCount = searchParams.get('attendee_count');
    const budget = searchParams.get('budget');
    const location = searchParams.get('location');
    const eventDate = searchParams.get('event_date');

    // Validate request
    const validationResult = ServiceRecommendationRequestSchema.safeParse({
      event_type: eventType,
      user_id: userId,
      attendee_count: attendeeCount ? parseInt(attendeeCount) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
      location,
      event_date: eventDate,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      event_type,
      attendee_count,
      budget: eventBudget,
      location: eventLocation,
    } = validationResult.data;

    // Check cache first
    const cacheKey = aiCache.generateKey(
      'recommendations',
      event_type,
      userId || 'anonymous',
      {
        attendee_count,
        budget: eventBudget,
        location: eventLocation,
      }
    );
    const cachedRecommendations = aiCache.get(cacheKey);

    if (cachedRecommendations) {
      return NextResponse.json({
        recommendations: cachedRecommendations,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Get base recommendations for event type
    const baseRecommendations =
      EVENT_TYPE_SERVICE_MAPPING[
        event_type as keyof typeof EVENT_TYPE_SERVICE_MAPPING
      ] || [];

    // Get user preferences if available
    let userPreferences = {};
    if (userId) {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('preference_type, preference_data')
        .eq('user_id', userId);

      if (preferences) {
        userPreferences = preferences.reduce(
          (acc, pref) => {
            acc[pref.preference_type] = pref.preference_data;
            return acc;
          },
          {} as Record<string, any>
        );
      }
    }

    // Generate recommendations with AI-like logic
    const recommendations = baseRecommendations.map((rec, index) => {
      let confidence = rec.confidence;
      let priority = rec.priority;

      // Adjust based on attendee count
      if (attendee_count) {
        if (attendee_count > 100) {
          confidence += 0.05; // Higher confidence for larger events
          if (rec.category === 'Event Management')
            priority = Math.min(5, priority + 1);
        } else if (attendee_count < 20) {
          confidence -= 0.05; // Lower confidence for smaller events
          if (rec.category === 'Event Management')
            priority = Math.max(1, priority - 1);
        }
      }

      // Adjust based on budget
      if (eventBudget) {
        const budgetPerPerson = eventBudget / (attendee_count || 50);
        if (budgetPerPerson > 200) {
          confidence += 0.05; // Higher confidence for higher budgets
        } else if (budgetPerPerson < 50) {
          confidence -= 0.05; // Lower confidence for lower budgets
        }
      }

      // Adjust based on user preferences
      if (userPreferences[rec.category.toLowerCase()]) {
        confidence += 0.1; // Boost confidence for preferred categories
      }

      // Generate estimated cost based on event type and attendee count
      let estimatedCost = 0;
      const bestPractices =
        INDUSTRY_BEST_PRACTICES[
          event_type as keyof typeof INDUSTRY_BEST_PRACTICES
        ];
      if (bestPractices && eventBudget) {
        const categoryKey = rec.category.toLowerCase().replace(/[^a-z]/g, '');
        const allocation =
          bestPractices.budget_allocation[
            categoryKey as keyof typeof bestPractices.budget_allocation
          ] || 0.1;
        estimatedCost = eventBudget * allocation;
      }

      return {
        id: `rec_${event_type}_${index}`,
        event_type,
        service_category: rec.category,
        service_name: rec.category,
        priority: Math.min(5, Math.max(1, priority)),
        confidence_score: Math.min(1, Math.max(0, confidence)),
        is_required: rec.required,
        description: `Recommended ${rec.category.toLowerCase()} service for ${event_type} events`,
        estimated_cost:
          estimatedCost > 0 ? Math.round(estimatedCost) : undefined,
        created_at: new Date().toISOString(),
      };
    });

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.confidence_score - a.confidence_score;
    });

    // Get confidence scores for all recommendations
    const confidenceScores = recommendations.map(rec => ({
      recommendation_id: rec.id,
      confidence_score: rec.confidence_score,
      factors: {
        event_type_match: 0.8,
        user_preferences: userPreferences[rec.service_category.toLowerCase()]
          ? 0.1
          : 0,
        attendee_count: attendee_count
          ? attendee_count > 100
            ? 0.05
            : attendee_count < 20
              ? -0.05
              : 0
          : 0,
        budget_appropriateness: eventBudget
          ? eventBudget / (attendee_count || 50) > 200
            ? 0.05
            : -0.05
          : 0,
      },
    }));

    const responseData = {
      recommendations,
      confidence_scores: confidenceScores,
      metadata: {
        event_type,
        total_recommendations: recommendations.length,
        required_services: recommendations.filter(r => r.is_required).length,
        optional_services: recommendations.filter(r => !r.is_required).length,
        average_confidence:
          recommendations.reduce((sum, r) => sum + r.confidence_score, 0) /
          recommendations.length,
      },
    };

    // Cache the recommendations
    aiCache.setWithType(cacheKey, recommendations, 'recommendations');

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error generating service recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { recommendation_id, feedback_type, rating, comments } = body;

    if (!recommendation_id || !feedback_type || !rating) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: recommendation_id, feedback_type, rating',
        },
        { status: 400 }
      );
    }

    // Store feedback for learning
    const { data, error } = await supabase
      .from('recommendation_feedback')
      .insert({
        user_id: user.id,
        recommendation_id,
        feedback_type,
        rating,
        comments,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error storing recommendation feedback:', error);
      return NextResponse.json(
        { error: 'Failed to store feedback' },
        { status: 500 }
      );
    }

    // Invalidate cache for this user since feedback might affect future recommendations
    aiCache.clearByPattern(`recommendations:${event_type}:${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
    });
  } catch (error) {
    console.error('Error processing recommendation feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
