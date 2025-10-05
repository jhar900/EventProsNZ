import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  GetInquiryHistoryRequest,
  InquiryHistoryResponse,
  INQUIRY_STATUS,
} from '@/types/inquiries';

// Validation schemas
const getInquiryHistorySchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  status: z
    .enum(Object.values(INQUIRY_STATUS) as [string, ...string[]])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/inquiries/history - Get inquiry history with analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = getInquiryHistorySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { user_id, date_from, date_to, status, page, limit } =
      validationResult.data;
    const offset = (page - 1) * limit;

    // Get user role to determine access
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user can access the requested user's history
    const canAccess = userProfile.role === 'admin' || user.id === user_id;

    if (!canAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Build query for inquiries
    let query = supabase
      .from('inquiries')
      .select(
        `
        *,
        contractor:contractor_id (
          id,
          email,
          profiles!inner (
            first_name,
            last_name,
            avatar_url
          ),
          business_profiles!inner (
            company_name,
            average_rating,
            review_count
          )
        ),
        event_manager:event_manager_id (
          id,
          email,
          profiles!inner (
            first_name,
            last_name,
            avatar_url
          )
        ),
        event:event_id (
          id,
          title,
          event_type,
          event_date
        )
      `
      )
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userProfile.role === 'contractor') {
      query = query.eq('contractor_id', user_id);
    } else if (userProfile.role === 'event_manager') {
      query = query.eq('event_manager_id', user_id);
    } else if (userProfile.role === 'admin') {
      // Admins can see all inquiries
      query = query.or(
        `event_manager_id.eq.${user_id},contractor_id.eq.${user_id}`
      );
    }

    // Apply date filters
    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: inquiries, error: inquiriesError } = await query;

    if (inquiriesError) {
      console.error('Inquiry history fetch error:', inquiriesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch inquiry history' },
        { status: 500 }
      );
    }

    // Get analytics data
    const analyticsQuery = supabase
      .from('inquiries')
      .select('status, created_at, inquiry_type, event_details');

    // Apply same filters for analytics
    if (userProfile.role === 'contractor') {
      analyticsQuery.eq('contractor_id', user_id);
    } else if (userProfile.role === 'event_manager') {
      analyticsQuery.eq('event_manager_id', user_id);
    } else if (userProfile.role === 'admin') {
      analyticsQuery.or(
        `event_manager_id.eq.${user_id},contractor_id.eq.${user_id}`
      );
    }

    if (date_from) {
      analyticsQuery.gte('created_at', date_from);
    }

    if (date_to) {
      analyticsQuery.lte('created_at', date_to);
    }

    const { data: allInquiries, error: analyticsError } = await analyticsQuery;

    if (analyticsError) {
      console.error('Analytics fetch error:', analyticsError);
    }

    // Calculate analytics
    const totalInquiries = allInquiries?.length || 0;
    const statusCounts = {
      sent: 0,
      viewed: 0,
      responded: 0,
      quoted: 0,
    };

    let totalResponseTime = 0;
    let responseCount = 0;
    const serviceCounts: { [key: string]: number } = {};

    (allInquiries || []).forEach(inquiry => {
      // Count statuses
      switch (inquiry.status) {
        case 'sent':
          statusCounts.sent++;
          break;
        case 'viewed':
          statusCounts.viewed++;
          break;
        case 'responded':
          statusCounts.responded++;
          break;
        case 'quoted':
          statusCounts.quoted++;
          break;
      }

      // Calculate response time (simplified - would need more complex logic for real implementation)
      if (inquiry.status === 'responded' || inquiry.status === 'quoted') {
        const createdAt = new Date(inquiry.created_at);
        const now = new Date();
        const responseTime = now.getTime() - createdAt.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }

      // Count service types
      if (inquiry.event_details?.service_requirements) {
        inquiry.event_details.service_requirements.forEach((req: any) => {
          serviceCounts[req.category] = (serviceCounts[req.category] || 0) + 1;
        });
      }
    });

    const averageResponseTime =
      responseCount > 0 ? totalResponseTime / responseCount : 0;
    const conversionRate =
      totalInquiries > 0 ? (statusCounts.quoted / totalInquiries) * 100 : 0;

    const popularServices = Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const analytics = {
      total_inquiries: totalInquiries,
      status_counts: statusCounts,
      response_time_avg: averageResponseTime,
      conversion_rate: conversionRate,
      popular_services: popularServices,
    };

    const response: InquiryHistoryResponse = {
      inquiries: inquiries || [],
      analytics,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Inquiry history fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
