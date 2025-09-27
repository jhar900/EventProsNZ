import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const testId = params.id;

    // Get A/B test details
    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (testError) {
      return NextResponse.json(
        { error: 'A/B test not found' },
        { status: 404 }
      );
    }

    // Get test results
    const { data: results, error: resultsError } = await supabase
      .from('ab_test_results')
      .select('*')
      .eq('test_id', testId);

    if (resultsError) {
      return NextResponse.json(
        { error: 'Failed to fetch test results' },
        { status: 500 }
      );
    }

    // Calculate test statistics
    const controlResults = results?.filter(r => r.variant === 'control') || [];
    const variantResults = results?.filter(r => r.variant === 'variant') || [];

    const testResults = {
      test: test,
      control_results: controlResults,
      variant_results: variantResults,
      statistics: {
        control_participants: controlResults.length,
        variant_participants: variantResults.length,
        total_participants: results?.length || 0,
        control_avg_metric: 0,
        variant_avg_metric: 0,
        improvement_percentage: 0,
        statistical_significance: 0,
        confidence_level: 0,
      },
    };

    // Calculate average metrics for each variant
    if (controlResults.length > 0) {
      const controlValues = controlResults.map(r => r.metric_value || 0);
      testResults.statistics.control_avg_metric =
        controlValues.reduce((a, b) => a + b, 0) / controlValues.length;
    }

    if (variantResults.length > 0) {
      const variantValues = variantResults.map(r => r.metric_value || 0);
      testResults.statistics.variant_avg_metric =
        variantValues.reduce((a, b) => a + b, 0) / variantValues.length;
    }

    // Calculate improvement percentage
    if (testResults.statistics.control_avg_metric > 0) {
      testResults.statistics.improvement_percentage =
        ((testResults.statistics.variant_avg_metric -
          testResults.statistics.control_avg_metric) /
          testResults.statistics.control_avg_metric) *
        100;
    }

    // Simple statistical significance calculation (t-test approximation)
    if (controlResults.length > 0 && variantResults.length > 0) {
      const controlValues = controlResults.map(r => r.metric_value || 0);
      const variantValues = variantResults.map(r => r.metric_value || 0);

      const controlMean = testResults.statistics.control_avg_metric;
      const variantMean = testResults.statistics.variant_avg_metric;

      const controlVariance =
        controlValues.reduce(
          (sum, val) => sum + Math.pow(val - controlMean, 2),
          0
        ) / controlValues.length;
      const variantVariance =
        variantValues.reduce(
          (sum, val) => sum + Math.pow(val - variantMean, 2),
          0
        ) / variantValues.length;

      const pooledVariance =
        ((controlValues.length - 1) * controlVariance +
          (variantValues.length - 1) * variantVariance) /
        (controlValues.length + variantValues.length - 2);

      const standardError = Math.sqrt(
        pooledVariance * (1 / controlValues.length + 1 / variantValues.length)
      );
      const tStatistic = Math.abs(variantMean - controlMean) / standardError;

      // Approximate confidence level based on t-statistic
      if (tStatistic > 2.576) {
        testResults.statistics.confidence_level = 99;
      } else if (tStatistic > 1.96) {
        testResults.statistics.confidence_level = 95;
      } else if (tStatistic > 1.645) {
        testResults.statistics.confidence_level = 90;
      } else {
        testResults.statistics.confidence_level = 80;
      }

      testResults.statistics.statistical_significance = tStatistic;
    }

    return NextResponse.json({
      test_results: testResults,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
