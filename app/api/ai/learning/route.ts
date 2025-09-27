import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const EventSuccessSchema = z.object({
  event_id: z.string().uuid(),
  services_used: z.array(z.string()),
  success_metrics: z.object({
    overall_rating: z.number().min(1).max(5),
    budget_variance: z.number(), // percentage over/under budget
    timeline_adherence: z.number().min(0).max(1), // 0-1 scale
    attendee_satisfaction: z.number().min(1).max(5).optional(),
    vendor_performance: z.record(z.number().min(1).max(5)).optional(),
  }),
  feedback: z.string().optional(),
});

const LearningPatternSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  service_combination: z.array(z.string()),
  success_rate: z.number().min(0).max(1),
  average_rating: z.number().min(1).max(5),
  sample_size: z.number(),
  confidence_level: z.number().min(0).max(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const LearningInsightSchema = z.object({
  id: z.string(),
  insight_type: z.enum([
    'service_combination',
    'budget_optimization',
    'timeline_insight',
    'vendor_performance',
  ]),
  title: z.string(),
  description: z.string(),
  data: z.record(z.any()),
  confidence: z.number().min(0).max(1),
  created_at: z.string().datetime(),
});

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
    const { event_id, services_used, success_metrics, feedback } = body;

    // Validate request body
    const validationResult = EventSuccessSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_type, attendee_count, budget, user_id')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Verify user owns the event
    if (event.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this event' },
        { status: 403 }
      );
    }

    // Store learning data
    const learningData = {
      event_id,
      user_id: user.id,
      event_type: event.event_type,
      services_used,
      success_metrics,
      feedback,
      attendee_count: event.attendee_count,
      budget: event.budget,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('ai_learning_data')
      .insert(learningData);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to store learning data' },
        { status: 500 }
      );
    }

    // Update service combination patterns
    await updateServicePatterns(
      supabase,
      event.event_type,
      services_used,
      success_metrics
    );

    // Generate insights if this is a highly successful event
    if (success_metrics.overall_rating >= 4.5) {
      await generateInsights(
        supabase,
        event.event_type,
        services_used,
        success_metrics
      );
    }

    return NextResponse.json({
      success: true,
      learning_updated: true,
      message: 'Learning data recorded successfully',
    });
  } catch (error) {
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
    const eventType = searchParams.get('event_type');
    const timePeriod = searchParams.get('time_period') || '30'; // days

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timePeriod));

    // Get service patterns
    let patternsQuery = supabase
      .from('service_patterns')
      .select('*')
      .gte('updated_at', startDate.toISOString())
      .order('success_rate', { ascending: false });

    if (eventType) {
      patternsQuery = patternsQuery.eq('event_type', eventType);
    }

    const { data: patterns, error: patternsError } = await patternsQuery;

    if (patternsError) {
      }

    // Get learning insights
    let insightsQuery = supabase
      .from('learning_insights')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('confidence', { ascending: false });

    if (eventType) {
      insightsQuery = insightsQuery.eq('event_type', eventType);
    }

    const { data: insights, error: insightsError } = await insightsQuery;

    if (insightsError) {
      }

    // Get aggregated learning statistics
    const { data: stats, error: statsError } = await supabase
      .from('ai_learning_data')
      .select('event_type, success_metrics')
      .gte('created_at', startDate.toISOString());

    if (statsError) {
      }

    // Process statistics
    const statistics = {
      total_events: stats?.length || 0,
      average_rating: 0,
      success_rate: 0,
      top_service_combinations: [],
      budget_insights: {},
    };

    if (stats && stats.length > 0) {
      const ratings = stats.map(s => s.success_metrics.overall_rating);
      statistics.average_rating =
        ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      statistics.success_rate =
        ratings.filter(rating => rating >= 4).length / ratings.length;

      // Group by event type
      const eventTypeStats = stats.reduce(
        (acc, stat) => {
          if (!acc[stat.event_type]) {
            acc[stat.event_type] = [];
          }
          acc[stat.event_type].push(stat.success_metrics);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Calculate budget insights
      Object.entries(eventTypeStats).forEach(([type, metrics]) => {
        const budgetVariances = metrics.map(m => m.budget_variance);
        statistics.budget_insights[type] = {
          average_variance:
            budgetVariances.reduce((sum, v) => sum + v, 0) /
            budgetVariances.length,
          median_variance: budgetVariances.sort((a, b) => a - b)[
            Math.floor(budgetVariances.length / 2)
          ],
        };
      });
    }

    return NextResponse.json({
      patterns: patterns || [],
      insights: insights || [],
      statistics,
      metadata: {
        time_period: timePeriod,
        event_type: eventType,
        patterns_count: patterns?.length || 0,
        insights_count: insights?.length || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update service patterns
async function updateServicePatterns(
  supabase: any,
  eventType: string,
  servicesUsed: string[],
  successMetrics: any
) {
  try {
    const serviceCombination = servicesUsed.sort().join(',');

    // Check if pattern already exists
    const { data: existingPattern } = await supabase
      .from('service_patterns')
      .select('*')
      .eq('event_type', eventType)
      .eq('service_combination', serviceCombination)
      .single();

    if (existingPattern) {
      // Update existing pattern
      const newSampleSize = existingPattern.sample_size + 1;
      const newAverageRating =
        (existingPattern.average_rating * existingPattern.sample_size +
          successMetrics.overall_rating) /
        newSampleSize;
      const newSuccessRate =
        existingPattern.success_rate * existingPattern.sample_size +
        (successMetrics.overall_rating >= 4 ? 1 : 0);
      const updatedSuccessRate = newSuccessRate / newSampleSize;

      await supabase
        .from('service_patterns')
        .update({
          success_rate: updatedSuccessRate,
          average_rating: newAverageRating,
          sample_size: newSampleSize,
          confidence_level: Math.min(1, newSampleSize / 10), // Increase confidence with more samples
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPattern.id);
    } else {
      // Create new pattern
      await supabase.from('service_patterns').insert({
        event_type: eventType,
        service_combination: serviceCombination,
        success_rate: successMetrics.overall_rating >= 4 ? 1 : 0,
        average_rating: successMetrics.overall_rating,
        sample_size: 1,
        confidence_level: 0.1, // Low confidence for new patterns
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    }
}

// Helper function to generate insights
async function generateInsights(
  supabase: any,
  eventType: string,
  servicesUsed: string[],
  successMetrics: any
) {
  try {
    // Generate service combination insight
    if (servicesUsed.length > 3) {
      const insight = {
        event_type: eventType,
        insight_type: 'service_combination',
        title: `High-performing service combination for ${eventType}`,
        description: `The combination of ${servicesUsed.join(', ')} achieved a rating of ${successMetrics.overall_rating}/5`,
        data: {
          services: servicesUsed,
          rating: successMetrics.overall_rating,
          budget_variance: successMetrics.budget_variance,
        },
        confidence: 0.8,
        created_at: new Date().toISOString(),
      };

      await supabase.from('learning_insights').insert(insight);
    }

    // Generate budget optimization insight
    if (Math.abs(successMetrics.budget_variance) < 5) {
      // Within 5% of budget
      const insight = {
        event_type: eventType,
        insight_type: 'budget_optimization',
        title: `Optimal budget allocation for ${eventType}`,
        description: `This event stayed within ${Math.abs(successMetrics.budget_variance)}% of the planned budget`,
        data: {
          budget_variance: successMetrics.budget_variance,
          services: servicesUsed,
        },
        confidence: 0.7,
        created_at: new Date().toISOString(),
      };

      await supabase.from('learning_insights').insert(insight);
    }
  } catch (error) {
    }
}
