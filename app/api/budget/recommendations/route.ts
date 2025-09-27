import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BudgetService } from '@/lib/budget/budget-service';
import { z } from 'zod';

const BudgetRecommendationSchema = z.object({
  event_type: z.string().min(1),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
  attendee_count: z.number().min(1).optional(),
  duration: z.number().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('event_type');
    const locationParam = searchParams.get('location');
    const attendeeCount = searchParams.get('attendee_count');
    const duration = searchParams.get('duration');

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Parse location if provided
    let location = undefined; // Use undefined instead of null for optional Zod fields
    if (locationParam) {
      try {
        location = JSON.parse(locationParam);
      } catch {
        return NextResponse.json(
          { error: 'Invalid location format' },
          { status: 400 }
        );
      }
    }

    // Validate input
    const validation = BudgetRecommendationSchema.safeParse({
      event_type: eventType,
      location,
      attendee_count: attendeeCount ? parseInt(attendeeCount) : undefined,
      duration: duration ? parseInt(duration) : undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      event_type,
      location: loc,
      attendee_count,
      duration: eventDuration,
    } = validation.data;

    // Use BudgetService for actual calculations
    const budgetService = new BudgetService();

    try {
      const budgetCalculation =
        await budgetService.calculateBudgetRecommendations(
          event_type,
          loc,
          attendee_count,
          eventDuration
        );

      return NextResponse.json({
        recommendations: budgetCalculation.recommendations,
        total_budget: budgetCalculation.total_budget,
        breakdown: budgetCalculation.breakdown,
        adjustments: budgetCalculation.adjustments,
        metadata: budgetCalculation.metadata,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to calculate budget recommendations' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get user session
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

    // Store feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('budget_feedback')
      .insert({
        recommendation_id,
        feedback_type,
        rating,
        comments,
        user_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (feedbackError) {
      return NextResponse.json(
        { error: 'Failed to store feedback' },
        { status: 500 }
      );
    }

    // Update recommendation confidence score based on feedback
    const confidenceAdjustment = rating >= 4 ? 0.1 : rating <= 2 ? -0.1 : 0;

    const { error: updateError } = await supabase
      .from('budget_recommendations')
      .update({
        confidence_score: Math.max(
          0,
          Math.min(
            1,
            (recommendations?.find(r => r.id === recommendation_id)
              ?.confidence_score || 0.5) + confidenceAdjustment
          )
        ),
      })
      .eq('id', recommendation_id);

    if (updateError) {
      }

    return NextResponse.json({
      success: true,
      feedback,
      updated_recommendation: recommendations?.find(
        r => r.id === recommendation_id
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
