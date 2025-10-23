import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/testimonials/platform/analytics - Get platform testimonial analytics
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

    // Get analytics data
    const [
      totalTestimonials,
      approvedTestimonials,
      pendingTestimonials,
      rejectedTestimonials,
      ratingDistribution,
      categoryBreakdown,
      recentTestimonials,
    ] = await Promise.all([
      // Total testimonials
      supabase.from('platform_testimonials').select('id', { count: 'exact' }),

      // Approved testimonials
      supabase
        .from('platform_testimonials')
        .select('id', { count: 'exact' })
        .eq('status', 'approved'),

      // Pending testimonials
      supabase
        .from('platform_testimonials')
        .select('id', { count: 'exact' })
        .eq('status', 'pending'),

      // Rejected testimonials
      supabase
        .from('platform_testimonials')
        .select('id', { count: 'exact' })
        .eq('status', 'rejected'),

      // Rating distribution
      supabase
        .from('platform_testimonials')
        .select('rating')
        .eq('status', 'approved'),

      // Category breakdown
      supabase
        .from('platform_testimonials')
        .select('category')
        .eq('status', 'approved'),

      // Recent testimonials (last 30 days)
      supabase
        .from('platform_testimonials')
        .select(
          `
          id,
          rating,
          feedback,
          category,
          created_at,
          user:users!platform_testimonials_user_id_fkey(
            first_name,
            last_name
          )
        `
        )
        .eq('status', 'approved')
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Calculate rating distribution
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingDistribution.data) {
      ratingDistribution.data.forEach(testimonial => {
        ratingCounts[testimonial.rating as keyof typeof ratingCounts]++;
      });
    }

    // Calculate average rating
    const totalRatings = Object.values(ratingCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    const averageRating =
      totalRatings > 0
        ? Object.entries(ratingCounts).reduce(
            (sum, [rating, count]) => sum + parseInt(rating) * count,
            0
          ) / totalRatings
        : 0;

    // Calculate category breakdown
    const categoryCounts = { event_manager: 0, contractor: 0 };
    if (categoryBreakdown.data) {
      categoryBreakdown.data.forEach(testimonial => {
        categoryCounts[testimonial.category as keyof typeof categoryCounts]++;
      });
    }

    // Calculate approval rate
    const totalCount = totalTestimonials.count || 0;
    const approvedCount = approvedTestimonials.count || 0;
    const approvalRate =
      totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;

    const analytics = {
      overview: {
        total: totalCount,
        approved: approvedCount,
        pending: pendingTestimonials.count || 0,
        rejected: rejectedTestimonials.count || 0,
        approvalRate: Math.round(approvalRate * 100) / 100,
      },
      ratings: {
        average: Math.round(averageRating * 100) / 100,
        distribution: ratingCounts,
        total: totalRatings,
      },
      categories: {
        event_manager: categoryCounts.event_manager,
        contractor: categoryCounts.contractor,
      },
      recent: recentTestimonials.data || [],
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error in GET /api/testimonials/platform/analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
