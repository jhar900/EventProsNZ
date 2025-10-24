import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const getAdminFeatureRequestsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 1),
  limit: z
    .string()
    .optional()
    .transform(val => Math.min(parseInt(val) || 20, 100)),
  status: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'updated_at', 'vote_count', 'priority', 'status'])
    .optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// GET /api/admin/feature-requests - Get feature requests for admin management
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
    const validatedParams = getAdminFeatureRequestsSchema.parse(queryParams);

    const { page, limit, status, priority, search, sort_by, sort_order } =
      validatedParams;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from('feature_requests').select(
      `
        *,
        feature_request_categories(name, color),
        feature_request_tag_assignments(
          feature_request_tags(name)
        ),
        profiles(first_name, last_name, avatar_url),
        assigned_user:profiles!feature_requests_assigned_to_fkey(first_name, last_name)
        `,
      { count: 'exact' }
    );

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    const sortColumn = sort_by || 'created_at';
    const sortDirection = sort_order || 'desc';
    query = query.order(sortColumn, { ascending: sortDirection === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: requests, error: requestsError, count } = await query;

    if (requestsError) {
      console.error('Error fetching feature requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch feature requests' },
        { status: 500 }
      );
    }

    // Transform the data to include proper tag structure
    const transformedRequests =
      requests?.map(request => ({
        ...request,
        tags:
          request.feature_request_tag_assignments?.map((assignment: any) => ({
            name: assignment.feature_request_tags?.name,
          })) || [],
        author: request.profiles,
        assigned_to: request.assigned_user,
      })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      requests: transformedRequests,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/feature-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
