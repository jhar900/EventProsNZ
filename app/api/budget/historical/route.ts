import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const HistoricalPricingSchema = z.object({
  service_type: z.string().min(1),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
  time_period: z
    .enum(['3months', '6months', '1year', '2years', 'all'])
    .optional(),
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
    const serviceType = searchParams.get('service_type');
    const locationParam = searchParams.get('location');
    const timePeriod = searchParams.get('time_period') || '1year';

    if (!serviceType) {
      return NextResponse.json(
        { error: 'Service type is required' },
        { status: 400 }
      );
    }

    // Parse location if provided
    let location = null;
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
    const validation = HistoricalPricingSchema.safeParse({
      service_type: serviceType,
      location,
      time_period: timePeriod,
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

    // Calculate date range based on time period
    const now = new Date();
    let startDate = new Date();

    switch (timePeriod) {
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case '2years':
        startDate.setFullYear(now.getFullYear() - 2);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Arbitrary start date
        break;
    }

    // Get historical pricing data
    const { data: historicalPricing, error: historicalError } = await supabase
      .from('pricing_data')
      .select('*')
      .eq('service_type', serviceType)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (historicalError) {
      return NextResponse.json(
        { error: 'Failed to fetch historical pricing' },
        { status: 500 }
      );
    }

    // Get budget tracking data for actual costs
    const { data: budgetTracking, error: trackingError } = await supabase
      .from('budget_tracking')
      .select('*')
      .eq('service_category', serviceType)
      .gte('tracking_date', startDate.toISOString())
      .order('tracking_date', { ascending: true });

    if (trackingError) {
      }

    // Process historical data into trends
    const trends = [];
    if (historicalPricing && historicalPricing.length > 0) {
      // Group by month for trend analysis
      const monthlyData = {};

      historicalPricing.forEach(item => {
        const month = new Date(item.created_at).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            prices: [],
            count: 0,
          };
        }
        monthlyData[month].prices.push(item.price_average);
        monthlyData[month].count++;
      });

      // Calculate monthly averages and trends
      Object.values(monthlyData).forEach((data: any) => {
        const average =
          data.prices.reduce((sum: number, price: number) => sum + price, 0) /
          data.prices.length;
        trends.push({
          month: data.month,
          average_price: Math.round(average * 100) / 100,
          data_points: data.count,
          price_range: {
            min: Math.min(...data.prices),
            max: Math.max(...data.prices),
          },
        });
      });
    }

    // Calculate price trends
    const priceTrends = [];
    if (trends.length > 1) {
      const firstPrice = trends[0].average_price;
      const lastPrice = trends[trends.length - 1].average_price;
      const priceChange = lastPrice - firstPrice;
      const percentChange = (priceChange / firstPrice) * 100;

      priceTrends.push({
        period: timePeriod,
        price_change: Math.round(priceChange * 100) / 100,
        percent_change: Math.round(percentChange * 100) / 100,
        trend_direction:
          priceChange > 0
            ? 'increasing'
            : priceChange < 0
              ? 'decreasing'
              : 'stable',
        volatility: calculateVolatility(trends.map(t => t.average_price)),
      });
    }

    // Add actual cost data from budget tracking
    const actualCosts = [];
    if (budgetTracking && budgetTracking.length > 0) {
      budgetTracking.forEach(track => {
        if (track.actual_cost) {
          actualCosts.push({
            date: track.tracking_date,
            actual_cost: track.actual_cost,
            estimated_cost: track.estimated_cost,
            variance: track.variance,
            variance_percent: track.estimated_cost
              ? (track.variance / track.estimated_cost) * 100
              : 0,
          });
        }
      });
    }

    return NextResponse.json({
      historical_pricing: historicalPricing || [],
      trends: trends,
      price_trends: priceTrends,
      actual_costs: actualCosts,
      metadata: {
        service_type: serviceType,
        location: location,
        time_period: timePeriod,
        start_date: startDate.toISOString(),
        end_date: now.toISOString(),
        data_points: historicalPricing?.length || 0,
        actual_cost_points: actualCosts.length,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const variance =
    prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
    prices.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}
