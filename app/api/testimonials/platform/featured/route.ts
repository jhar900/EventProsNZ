import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createFeaturedTestimonialSchema = z.object({
  testimonial_id: z.string().uuid(),
  display_order: z.number().int().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_active: z.boolean().optional().default(true),
});

// GET /api/testimonials/platform/featured - Get featured testimonials
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

    // Get featured testimonials
    const { data: featuredTestimonials, error: featuredError } = await supabase
      .from('featured_testimonials')
      .select(
        `
        id,
        testimonial_id,
        display_order,
        start_date,
        end_date,
        is_active,
        created_at,
        testimonial:platform_testimonials(
          id,
          rating,
          feedback,
          category,
          status,
          is_verified,
          is_public,
          created_at,
          user:users!platform_testimonials_user_id_fkey(
            id,
            first_name,
            last_name,
            profile_photo_url
          )
        )
      `
      )
      .order('display_order', { ascending: true });

    if (featuredError) {
      console.error('Error fetching featured testimonials:', featuredError);
      return NextResponse.json(
        { error: 'Failed to fetch featured testimonials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      featuredTestimonials: featuredTestimonials || [],
    });
  } catch (error) {
    console.error('Error in GET /api/testimonials/platform/featured:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/testimonials/platform/featured - Create featured testimonial
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createFeaturedTestimonialSchema.parse(body);

    // Verify testimonial exists and is approved
    const { data: testimonial, error: testimonialError } = await supabase
      .from('platform_testimonials')
      .select('id, status')
      .eq('id', validatedData.testimonial_id)
      .eq('status', 'approved')
      .single();

    if (testimonialError || !testimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found or not approved' },
        { status: 404 }
      );
    }

    // Check if testimonial is already featured
    const { data: existingFeatured, error: existingError } = await supabase
      .from('featured_testimonials')
      .select('id')
      .eq('testimonial_id', validatedData.testimonial_id)
      .single();

    if (existingFeatured) {
      return NextResponse.json(
        { error: 'Testimonial is already featured' },
        { status: 409 }
      );
    }

    // Create featured testimonial
    const { data: featuredTestimonial, error: featuredError } = await supabase
      .from('featured_testimonials')
      .insert({
        testimonial_id: validatedData.testimonial_id,
        display_order: validatedData.display_order,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        is_active: validatedData.is_active,
      })
      .select(
        `
        id,
        testimonial_id,
        display_order,
        start_date,
        end_date,
        is_active,
        created_at,
        testimonial:platform_testimonials(
          id,
          rating,
          feedback,
          category,
          status,
          is_verified,
          is_public,
          created_at,
          user:users!platform_testimonials_user_id_fkey(
            id,
            first_name,
            last_name,
            profile_photo_url
          )
        )
      `
      )
      .single();

    if (featuredError) {
      console.error('Error creating featured testimonial:', featuredError);
      return NextResponse.json(
        { error: 'Failed to create featured testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Featured testimonial created successfully',
      featuredTestimonial,
    });
  } catch (error) {
    console.error('Error in POST /api/testimonials/platform/featured:', error);

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
