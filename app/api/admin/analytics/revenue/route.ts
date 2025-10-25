import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get revenue data
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, created_at, status, subscription_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

    if (paymentsError) {
      throw paymentsError;
    }

    // Get subscription data
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('plan, amount, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    // Calculate revenue trends
    const revenueData = calculateRevenueTrends(payments || [], period);

    // Calculate subscription analytics
    const subscriptionData = calculateSubscriptionAnalytics(
      subscriptions || []
    );

    // Calculate summary metrics
    const totalRevenue =
      payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const subscriptionRevenue =
      subscriptions?.reduce((sum, sub) => sum + sub.amount, 0) || 0;
    const transactionRevenue = totalRevenue - subscriptionRevenue;
    const averageTransactionValue = payments?.length
      ? totalRevenue / payments.length
      : 0;
    const revenueGrowth = 12.5; // Simulated growth rate
    const churnRate = 5.2; // Simulated churn rate
    const lifetimeValue = 1250; // Simulated LTV

    const summary = {
      totalRevenue,
      monthlyRecurringRevenue: subscriptionRevenue,
      averageTransactionValue,
      revenueGrowth,
      churnRate,
      lifetimeValue,
    };

    const trends = {
      revenueTrend: 'up' as const,
      subscriptionTrend: 'up' as const,
      churnTrend: 'down' as const,
    };

    const forecast = {
      nextMonth: totalRevenue * 1.1,
      nextQuarter: totalRevenue * 1.3,
      confidence: 85,
    };

    return NextResponse.json({
      revenue: revenueData,
      subscriptions: subscriptionData,
      summary,
      trends,
      forecast,
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateRevenueTrends(payments: any[], period: string) {
  const buckets = getTimeBuckets(period);
  const revenue = new Array(buckets).fill(0);
  const subscriptionRevenue = new Array(buckets).fill(0);
  const transactionRevenue = new Array(buckets).fill(0);
  const refunds = new Array(buckets).fill(0);

  payments.forEach(payment => {
    const date = new Date(payment.created_at);
    const bucketIndex = getBucketIndex(date, period, buckets);
    if (bucketIndex >= 0 && bucketIndex < buckets) {
      revenue[bucketIndex] += payment.amount;

      if (payment.subscription_id) {
        subscriptionRevenue[bucketIndex] += payment.amount;
      } else {
        transactionRevenue[bucketIndex] += payment.amount;
      }

      if (payment.status === 'refunded') {
        refunds[bucketIndex] += payment.amount;
      }
    }
  });

  return revenue.map((total, index) => ({
    date: getDateLabel(index, period),
    totalRevenue: total,
    subscriptionRevenue: subscriptionRevenue[index],
    transactionRevenue: transactionRevenue[index],
    refunds: refunds[index],
    netRevenue: total - refunds[index],
  }));
}

function calculateSubscriptionAnalytics(subscriptions: any[]) {
  const planGroups = subscriptions.reduce(
    (groups, sub) => {
      const plan = sub.plan || 'Unknown';
      if (!groups[plan]) {
        groups[plan] = {
          plan,
          subscribers: 0,
          revenue: 0,
          churnRate: 0,
          growthRate: 0,
        };
      }
      groups[plan].subscribers++;
      groups[plan].revenue += sub.amount;
      return groups;
    },
    {} as Record<string, any>
  );

  // Calculate additional metrics
  Object.values(planGroups).forEach((plan: any) => {
    plan.churnRate = Math.random() * 10; // Simulated churn rate
    plan.growthRate = Math.random() * 20; // Simulated growth rate
  });

  return Object.values(planGroups);
}

function getTimeBuckets(period: string): number {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 12; // Weekly buckets
    default:
      return 30;
  }
}

function getBucketIndex(date: Date, period: string, buckets: number): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  switch (period) {
    case '7d':
    case '30d':
      return Math.floor(diff / (24 * 60 * 60 * 1000));
    case '90d':
      return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    default:
      return Math.floor(diff / (24 * 60 * 60 * 1000));
  }
}

function getDateLabel(index: number, period: string): string {
  const now = new Date();

  switch (period) {
    case '7d':
    case '30d':
      const day = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
      return day.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    case '90d':
      const week = new Date(now.getTime() - index * 7 * 24 * 60 * 60 * 1000);
      return week.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    default:
      return new Date().toLocaleDateString();
  }
}
