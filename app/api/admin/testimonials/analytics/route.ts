import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const getAnalyticsSchema = z.object({
  range: z.enum(['7d', '30d', '90d', '1y']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// GET /api/admin/testimonials/analytics - Get testimonial analytics
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

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = getAnalyticsSchema.parse(queryParams);

    // Calculate date range
    let startDate: Date;
    let endDate = new Date();

    if (validatedParams.start_date && validatedParams.end_date) {
      startDate = new Date(validatedParams.start_date);
      endDate = new Date(validatedParams.end_date);
    } else {
      const range = validatedParams.range || '30d';
      const days =
        range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // Get overview statistics
    const { data: overview, error: overviewError } = await supabase
      .from('platform_testimonials')
      .select('status, rating, is_verified, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (overviewError) {
      console.error('Error fetching overview:', overviewError);
      return NextResponse.json(
        { error: 'Failed to fetch overview data' },
        { status: 500 }
      );
    }

    // Calculate overview metrics
    const totalTestimonials = overview?.length || 0;
    const approvedTestimonials =
      overview?.filter(t => t.status === 'approved').length || 0;
    const pendingTestimonials =
      overview?.filter(t => t.status === 'pending').length || 0;
    const rejectedTestimonials =
      overview?.filter(t => t.status === 'rejected').length || 0;
    const averageRating =
      totalTestimonials > 0
        ? overview?.reduce((sum, t) => sum + t.rating, 0) / totalTestimonials ||
          0
        : 0;

    // Get rating distribution
    const ratingDistribution = {
      '1': overview?.filter(t => t.rating === 1).length || 0,
      '2': overview?.filter(t => t.rating === 2).length || 0,
      '3': overview?.filter(t => t.rating === 3).length || 0,
      '4': overview?.filter(t => t.rating === 4).length || 0,
      '5': overview?.filter(t => t.rating === 5).length || 0,
    };

    // Get category breakdown
    const categoryBreakdown = {
      event_manager:
        overview?.filter(t => t.category === 'event_manager').length || 0,
      contractor:
        overview?.filter(t => t.category === 'contractor').length || 0,
    };

    // Get status breakdown
    const statusBreakdown = {
      pending: pendingTestimonials,
      approved: approvedTestimonials,
      rejected: rejectedTestimonials,
      flagged: overview?.filter(t => t.status === 'flagged').length || 0,
    };

    // Get top performing testimonials (mock data for now)
    const { data: topPerformers, error: topPerformersError } = await supabase
      .from('platform_testimonials')
      .select(
        `
        id,
        rating,
        feedback,
        user:users!platform_testimonials_user_id_fkey(
          first_name,
          last_name
        )
      `
      )
      .eq('status', 'approved')
      .order('rating', { ascending: false })
      .limit(5);

    if (topPerformersError) {
      console.error('Error fetching top performers:', topPerformersError);
    }

    // Mock analytics data (in a real implementation, these would come from analytics tables)
    const analytics = {
      overview: {
        totalTestimonials,
        approvedTestimonials,
        pendingTestimonials,
        rejectedTestimonials,
        averageRating: Math.round(averageRating * 10) / 10,
        totalViews: Math.floor(totalTestimonials * 2.5), // Mock views
        engagementScore: Math.floor(Math.random() * 20) + 80, // Mock engagement
      },
      ratingDistribution,
      categoryBreakdown,
      statusBreakdown,
      trends: {
        daily: [], // Would be populated with daily trends
        weekly: [], // Would be populated with weekly trends
        monthly: [], // Would be populated with monthly trends
      },
      topPerformers:
        topPerformers?.map(t => ({
          id: t.id,
          rating: t.rating,
          feedback: t.feedback,
          views: Math.floor(Math.random() * 100) + 50,
          engagement_score: Math.floor(Math.random() * 20) + 80,
          user: t.user,
        })) || [],
      conversionMetrics: {
        testimonialToInquiry: Math.floor(Math.random() * 10) + 15,
        testimonialToSignup: Math.floor(Math.random() * 5) + 8,
        testimonialToConversion: Math.floor(Math.random() * 3) + 5,
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error in GET /api/admin/testimonials/analytics:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
