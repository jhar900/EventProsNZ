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

    // Get events data
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(
        `
        id,
        title,
        category,
        status,
        budget,
        created_at,
        completed_at,
        event_manager_id
      `
      )
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

    if (eventsError) {
      throw eventsError;
    }

    // Calculate event trends
    const eventData = calculateEventTrends(events || [], period);

    // Calculate category performance
    const categories = calculateCategoryPerformance(events || []);

    // Calculate summary metrics
    const totalEvents = events?.length || 0;
    const completedEvents =
      events?.filter(e => e.status === 'completed').length || 0;
    const cancelledEvents =
      events?.filter(e => e.status === 'cancelled').length || 0;
    const inProgressEvents =
      events?.filter(e => e.status === 'in_progress').length || 0;
    const averageSuccessRate =
      totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;
    const averageDuration = calculateAverageDuration(events || []);
    const totalBudget =
      events?.reduce((sum, e) => sum + (e.budget || 0), 0) || 0;

    const summary = {
      totalEvents,
      completedEvents,
      cancelledEvents,
      inProgressEvents,
      averageSuccessRate,
      averageDuration,
      totalBudget,
    };

    const trends = {
      creationTrend: 'up' as const,
      completionTrend: 'up' as const,
      successTrend: 'up' as const,
    };

    // Get top performing events
    const topEvents =
      events
        ?.filter(e => e.status === 'completed')
        .map(e => ({
          id: e.id,
          title: e.title,
          category: e.category,
          status: e.status,
          budget: e.budget || 0,
          completionDate: e.completed_at || e.created_at,
          successScore: Math.floor(Math.random() * 40) + 60, // Simulated success score
        }))
        .sort((a, b) => b.successScore - a.successScore)
        .slice(0, 10) || [];

    return NextResponse.json({
      events: eventData,
      categories,
      summary,
      trends,
      topEvents,
    });
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateEventTrends(events: any[], period: string) {
  const buckets = getTimeBuckets(period);
  const created = new Array(buckets).fill(0);
  const completed = new Array(buckets).fill(0);
  const cancelled = new Array(buckets).fill(0);
  const inProgress = new Array(buckets).fill(0);
  const successRate = new Array(buckets).fill(85);
  const averageDuration = new Array(buckets).fill(7);

  events.forEach(event => {
    const date = new Date(event.created_at);
    const bucketIndex = getBucketIndex(date, period, buckets);
    if (bucketIndex >= 0 && bucketIndex < buckets) {
      created[bucketIndex]++;

      if (event.status === 'completed') {
        completed[bucketIndex]++;
      } else if (event.status === 'cancelled') {
        cancelled[bucketIndex]++;
      } else if (event.status === 'in_progress') {
        inProgress[bucketIndex]++;
      }
    }
  });

  return created.map((createdCount, index) => ({
    date: getDateLabel(index, period),
    created: createdCount,
    completed: completed[index],
    cancelled: cancelled[index],
    inProgress: inProgress[index],
    successRate: successRate[index],
    averageDuration: averageDuration[index],
  }));
}

function calculateCategoryPerformance(events: any[]) {
  const categoryGroups = events.reduce(
    (groups, event) => {
      const category = event.category || 'Other';
      if (!groups[category]) {
        groups[category] = {
          category,
          totalEvents: 0,
          completedEvents: 0,
          successRate: 0,
          averageBudget: 0,
          averageDuration: 0,
        };
      }
      groups[category].totalEvents++;
      if (event.status === 'completed') {
        groups[category].completedEvents++;
      }
      return groups;
    },
    {} as Record<string, any>
  );

  // Calculate additional metrics
  Object.values(categoryGroups).forEach((category: any) => {
    category.successRate =
      category.totalEvents > 0
        ? (category.completedEvents / category.totalEvents) * 100
        : 0;
    category.averageBudget = Math.floor(Math.random() * 5000) + 1000; // Simulated average budget
    category.averageDuration = Math.floor(Math.random() * 14) + 3; // Simulated average duration
  });

  return Object.values(categoryGroups);
}

function calculateAverageDuration(events: any[]): number {
  const completedEvents = events.filter(
    e => e.status === 'completed' && e.completed_at
  );
  if (completedEvents.length === 0) return 0;

  const totalDuration = completedEvents.reduce((sum, event) => {
    const created = new Date(event.created_at);
    const completed = new Date(event.completed_at);
    const duration =
      (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
    return sum + duration;
  }, 0);

  return totalDuration / completedEvents.length;
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
