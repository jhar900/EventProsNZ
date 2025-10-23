import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const getAdminTestimonialsSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']).optional(),
  category: z.enum(['event_manager', 'contractor']).optional(),
  rating: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : undefined)),
  limit: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 20),
  offset: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 0),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'rating', 'status', 'user_name']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// GET /api/admin/testimonials - Get testimonials for admin management
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
    const validatedParams = getAdminTestimonialsSchema.parse(queryParams);

    // Build query
    let query = supabase.from('platform_testimonials').select(
      `
        id,
        rating,
        feedback,
        category,
        status,
        is_verified,
        is_public,
        created_at,
        approved_at,
        user:users!platform_testimonials_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_photo_url,
          email
        )
      `
    );

    // Apply filters
    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status);
    }

    if (validatedParams.category) {
      query = query.eq('category', validatedParams.category);
    }

    if (validatedParams.rating) {
      query = query.eq('rating', validatedParams.rating);
    }

    if (validatedParams.search) {
      query = query.or(
        `feedback.ilike.%${validatedParams.search}%,user.first_name.ilike.%${validatedParams.search}%,user.last_name.ilike.%${validatedParams.search}%`
      );
    }

    // Apply sorting
    const sortBy = validatedParams.sort_by || 'created_at';
    const sortOrder = validatedParams.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(
      validatedParams.offset,
      validatedParams.offset + validatedParams.limit - 1
    );

    const { data: testimonials, error: testimonialsError } = await query;

    if (testimonialsError) {
      console.error('Error fetching admin testimonials:', testimonialsError);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('platform_testimonials')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting testimonials count:', countError);
    }

    return NextResponse.json({
      testimonials,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        total: count || 0,
        hasMore: (count || 0) > validatedParams.offset + validatedParams.limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/testimonials:', error);

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
