import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { applyRateLimit, testimonialRateLimiter } from '@/lib/rate-limiting';

// Validation schemas
const createPlatformTestimonialSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().min(10).max(2000),
  category: z.enum(['event_manager', 'contractor']),
});

const getPlatformTestimonialsSchema = z.object({
  category: z.enum(['event_manager', 'contractor']).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']).optional(),
  limit: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 10),
  offset: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 0),
});

// POST /api/testimonials/platform - Submit platform testimonial
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(
      request,
      testimonialRateLimiter
    );
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPlatformTestimonialSchema.parse(body);

    // Get user data to determine category
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has already submitted a platform testimonial
    const { data: existingTestimonial, error: existingError } = await supabase
      .from('platform_testimonials')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingTestimonial) {
      return NextResponse.json(
        { error: 'You have already submitted a platform testimonial' },
        { status: 409 }
      );
    }

    // Check user verification status
    const { data: verification, error: verificationError } = await supabase
      .from('user_verification')
      .select('status')
      .eq('user_id', user.id)
      .eq('verification_type', 'email')
      .eq('status', 'verified')
      .single();

    const isVerified = !verificationError && verification;

    // Create platform testimonial
    const { data: testimonial, error: testimonialError } = await supabase
      .from('platform_testimonials')
      .insert({
        user_id: user.id,
        rating: validatedData.rating,
        feedback: validatedData.feedback,
        category: validatedData.category,
        status: 'pending',
        is_verified: !!isVerified,
        is_public: false,
      })
      .select(
        `
        *,
        user:users!platform_testimonials_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_photo_url
        )
      `
      )
      .single();

    if (testimonialError) {
      console.error('Error creating platform testimonial:', testimonialError);
      return NextResponse.json(
        { error: 'Failed to create testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Testimonial submitted successfully',
      testimonial,
    });
  } catch (error) {
    console.error('Error in POST /api/testimonials/platform:', error);

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

// GET /api/testimonials/platform - Get platform testimonials
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = getPlatformTestimonialsSchema.parse(queryParams);

    // Build query
    let query = supabase
      .from('platform_testimonials')
      .select(
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
          profile_photo_url
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(
        validatedParams.offset,
        validatedParams.offset + validatedParams.limit - 1
      );

    // Apply filters
    if (validatedParams.category) {
      query = query.eq('category', validatedParams.category);
    }

    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status);
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = !userError && userData?.role === 'admin';

    // If not admin, only show public approved testimonials
    if (!isAdmin) {
      query = query.eq('is_public', true).eq('status', 'approved');
    }

    const { data: testimonials, error: testimonialsError } = await query;

    if (testimonialsError) {
      console.error('Error fetching platform testimonials:', testimonialsError);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testimonials,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        hasMore: testimonials.length === validatedParams.limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/testimonials/platform:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
