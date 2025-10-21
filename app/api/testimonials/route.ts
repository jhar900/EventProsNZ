import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createTestimonialSchema = z.object({
  contractor_id: z.string().uuid(),
  inquiry_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().min(10).max(2000),
});

const getTestimonialsSchema = z.object({
  contractor_id: z.string().uuid().optional(),
  event_manager_id: z.string().uuid().optional(),
  is_approved: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  is_public: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  page: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 1),
  limit: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 10),
});

// POST /api/testimonials - Create testimonial
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTestimonialSchema.parse(body);

    // Verify user is event manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'event_manager') {
      return NextResponse.json(
        { error: 'Only event managers can create testimonials' },
        { status: 403 }
      );
    }

    // Verify eligibility - check if user has made an inquiry to this contractor
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('id, status')
      .eq('id', validatedData.inquiry_id)
      .eq('event_manager_id', user.id)
      .eq('contractor_id', validatedData.contractor_id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        {
          error:
            'You can only create testimonials for contractors you have inquired with',
        },
        { status: 403 }
      );
    }

    // Check if testimonial already exists for this inquiry
    const { data: existingTestimonial, error: existingError } = await supabase
      .from('testimonials')
      .select('id')
      .eq('inquiry_id', validatedData.inquiry_id)
      .single();

    if (existingTestimonial) {
      return NextResponse.json(
        {
          error: 'Testimonial already exists for this inquiry',
        },
        { status: 409 }
      );
    }

    // Create testimonial
    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .insert({
        contractor_id: validatedData.contractor_id,
        event_manager_id: user.id,
        inquiry_id: validatedData.inquiry_id,
        rating: validatedData.rating,
        review_text: validatedData.review_text,
        is_verified: true, // Verified because it's linked to an inquiry
      })
      .select()
      .single();

    if (testimonialError) {
      console.error('Error creating testimonial:', testimonialError);
      return NextResponse.json(
        { error: 'Failed to create testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        testimonial,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/testimonials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/testimonials - Get testimonials
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
    const validatedParams = getTestimonialsSchema.parse(queryParams);

    // Build query
    let query = supabase.from('testimonials').select(`
        *,
        contractor:users!testimonials_contractor_id_fkey(id, first_name, last_name, profile_photo_url),
        event_manager:users!testimonials_event_manager_id_fkey(id, first_name, last_name, profile_photo_url),
        inquiry:inquiries(id, subject, created_at)
      `);

    // Apply filters
    if (validatedParams.contractor_id) {
      query = query.eq('contractor_id', validatedParams.contractor_id);
    }
    if (validatedParams.event_manager_id) {
      query = query.eq('event_manager_id', validatedParams.event_manager_id);
    }
    if (validatedParams.is_approved !== undefined) {
      query = query.eq('is_approved', validatedParams.is_approved);
    }
    if (validatedParams.is_public !== undefined) {
      query = query.eq('is_public', validatedParams.is_public);
    }

    // Apply pagination
    const offset = (validatedParams.page - 1) * validatedParams.limit;
    query = query
      .range(offset, offset + validatedParams.limit - 1)
      .order('created_at', { ascending: false });

    const { data: testimonials, error: testimonialsError, count } = await query;

    if (testimonialsError) {
      console.error('Error fetching testimonials:', testimonialsError);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testimonials: testimonials || [],
      total: count || 0,
      page: validatedParams.page,
      limit: validatedParams.limit,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error in GET /api/testimonials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
