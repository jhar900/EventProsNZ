import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiCache } from '@/lib/ai/cache';
import { z } from 'zod';

// Validation schemas
const ABTestSchema = z.object({
  id: z.string(),
  test_name: z.string(),
  variant_a: z.record(z.any()),
  variant_b: z.record(z.any()),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const ABTestResultSchema = z.object({
  test_id: z.string(),
  variant: z.enum(['A', 'B']),
  result_data: z.object({
    user_id: z.string().optional(),
    event_type: z.string().optional(),
    recommendation_clicked: z.boolean().optional(),
    service_selected: z.boolean().optional(),
    conversion_rate: z.number().optional(),
    engagement_score: z.number().optional(),
    feedback_rating: z.number().min(1).max(5).optional(),
  }),
  timestamp: z.string().datetime(),
});

// Pre-defined A/B tests
const PREDEFINED_AB_TESTS = [
  {
    id: 'recommendation_algorithm_v1',
    test_name: 'Recommendation Algorithm Comparison',
    variant_a: {
      algorithm: 'rule_based',
      description: 'Rule-based recommendations using event type mapping',
      parameters: {
        confidence_threshold: 0.7,
        priority_weight: 0.6,
        user_preference_weight: 0.4,
      },
    },
    variant_b: {
      algorithm: 'hybrid_ml',
      description: 'Hybrid ML approach combining rules with machine learning',
      parameters: {
        confidence_threshold: 0.8,
        priority_weight: 0.5,
        user_preference_weight: 0.3,
        ml_confidence_boost: 0.2,
      },
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ui_layout_v1',
    test_name: 'Service Recommendation UI Layout',
    variant_a: {
      layout: 'grid',
      description: 'Grid layout with service cards',
      parameters: {
        cards_per_row: 3,
        show_priority: true,
        show_confidence: true,
        show_estimated_cost: true,
      },
    },
    variant_b: {
      layout: 'list',
      description: 'List layout with detailed information',
      parameters: {
        show_priority: true,
        show_confidence: true,
        show_estimated_cost: true,
        show_description: true,
        show_contractor_count: true,
      },
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'personalization_v1',
    test_name: 'Personalization Level',
    variant_a: {
      personalization: 'basic',
      description: 'Basic personalization based on event type only',
      parameters: {
        use_user_history: false,
        use_preferences: false,
        use_similar_events: false,
      },
    },
    variant_b: {
      personalization: 'advanced',
      description:
        'Advanced personalization using user history and preferences',
      parameters: {
        use_user_history: true,
        use_preferences: true,
        use_similar_events: true,
        learning_weight: 0.3,
      },
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
    const activeOnly = searchParams.get('active_only') === 'true';

    // Check cache first
    const cacheKey = aiCache.generateKey('ab_tests', user.id, activeOnly);
    const cachedTests = aiCache.get(cacheKey);

    if (cachedTests) {
      return NextResponse.json({
        tests: cachedTests,
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    const tests = [...PREDEFINED_AB_TESTS];

    // Get custom A/B tests from database
    let query = supabase.from('ai_ab_tests').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: customTests, error } = await query;

    if (error) {
      } else if (customTests) {
      tests.push(...customTests);
    }

    // Get test results for each test
    const testsWithResults = await Promise.all(
      tests.map(async test => {
        const { data: results } = await supabase
          .from('ai_ab_test_results')
          .select('*')
          .eq('test_id', test.id);

        const variantAResults = results?.filter(r => r.variant === 'A') || [];
        const variantBResults = results?.filter(r => r.variant === 'B') || [];

        // Calculate metrics
        const metrics = {
          variant_a: {
            total_participants: variantAResults.length,
            conversion_rate:
              variantAResults.length > 0
                ? variantAResults.filter(r => r.result_data.conversion_rate > 0)
                    .length / variantAResults.length
                : 0,
            average_engagement:
              variantAResults.length > 0
                ? variantAResults.reduce(
                    (sum, r) => sum + (r.result_data.engagement_score || 0),
                    0
                  ) / variantAResults.length
                : 0,
            average_rating:
              variantAResults.length > 0
                ? variantAResults.reduce(
                    (sum, r) => sum + (r.result_data.feedback_rating || 0),
                    0
                  ) / variantAResults.length
                : 0,
          },
          variant_b: {
            total_participants: variantBResults.length,
            conversion_rate:
              variantBResults.length > 0
                ? variantBResults.filter(r => r.result_data.conversion_rate > 0)
                    .length / variantBResults.length
                : 0,
            average_engagement:
              variantBResults.length > 0
                ? variantBResults.reduce(
                    (sum, r) => sum + (r.result_data.engagement_score || 0),
                    0
                  ) / variantBResults.length
                : 0,
            average_rating:
              variantBResults.length > 0
                ? variantBResults.reduce(
                    (sum, r) => sum + (r.result_data.feedback_rating || 0),
                    0
                  ) / variantBResults.length
                : 0,
          },
        };

        // Determine winning variant
        let winning_variant = null;
        if (variantAResults.length >= 10 && variantBResults.length >= 10) {
          const aScore =
            metrics.variant_a.conversion_rate * 0.4 +
            metrics.variant_a.average_engagement * 0.3 +
            metrics.variant_a.average_rating * 0.3;
          const bScore =
            metrics.variant_b.conversion_rate * 0.4 +
            metrics.variant_b.average_engagement * 0.3 +
            metrics.variant_b.average_rating * 0.3;

          if (Math.abs(aScore - bScore) > 0.1) {
            // 10% difference threshold
            winning_variant = aScore > bScore ? 'A' : 'B';
          }
        }

        return {
          ...test,
          metrics,
          winning_variant,
          total_participants: variantAResults.length + variantBResults.length,
          is_statistically_significant:
            variantAResults.length >= 10 && variantBResults.length >= 10,
        };
      })
    );

    // Cache the results
    aiCache.setWithType(cacheKey, testsWithResults, 'abTests');

    return NextResponse.json({
      tests: testsWithResults,
      metadata: {
        total_tests: testsWithResults.length,
        active_tests: testsWithResults.filter(t => t.is_active).length,
        completed_tests: testsWithResults.filter(t => t.winning_variant).length,
      },
    });
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { test_id, variant, result_data } = body;

    // Validate request body
    const validationResult = ABTestResultSchema.safeParse({
      test_id,
      variant,
      result_data,
      timestamp: new Date().toISOString(),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Check if test exists and is active
    const { data: test, error: testError } = await supabase
      .from('ai_ab_tests')
      .select('*')
      .eq('id', test_id)
      .eq('is_active', true)
      .single();

    if (testError || !test) {
      // Check predefined tests
      const predefinedTest = PREDEFINED_AB_TESTS.find(
        t => t.id === test_id && t.is_active
      );
      if (!predefinedTest) {
        return NextResponse.json(
          { error: 'Test not found or not active' },
          { status: 404 }
        );
      }
    }

    // Store test result
    const resultRecord = {
      test_id,
      variant,
      result_data,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('ai_ab_test_results')
      .insert(resultRecord);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to store test result' },
        { status: 500 }
      );
    }

    // Invalidate cache for this user since new test results might affect the data
    aiCache.clearByPattern(`ab_tests:${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Test result recorded successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to assign user to A/B test variant
export function assignUserToVariant(userId: string, testId: string): 'A' | 'B' {
  // Simple hash-based assignment for consistency
  const hash = userId.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return Math.abs(hash) % 2 === 0 ? 'A' : 'B';
}

// Helper function to get user's variant for a test
export async function getUserVariant(
  supabase: any,
  userId: string,
  testId: string
): Promise<'A' | 'B'> {
  // Check if user already has a variant assigned
  const { data: existingResult } = await supabase
    .from('ai_ab_test_results')
    .select('variant')
    .eq('test_id', testId)
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (existingResult) {
    return existingResult.variant as 'A' | 'B';
  }

  // Assign new variant
  const variant = assignUserToVariant(userId, testId);

  // Store the assignment
  await supabase.from('ai_ab_test_results').insert({
    test_id: testId,
    variant,
    user_id: userId,
    result_data: { assignment: true },
    timestamp: new Date().toISOString(),
  });

  return variant;
}
