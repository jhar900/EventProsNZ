import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const updateFeaturedTestimonialSchema = z.object({
  display_order: z.number().int().min(1).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  is_active: z.boolean().optional(),
});

// GET /api/testimonials/platform/featured/[id] - Get featured testimonial
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get featured testimonial
    const { data: featuredTestimonial, error: featuredError } = await supabase
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
      .eq('id', params.id)
      .single();

    if (featuredError || !featuredTestimonial) {
      return NextResponse.json(
        { error: 'Featured testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ featuredTestimonial });
  } catch (error) {
    console.error(
      'Error in GET /api/testimonials/platform/featured/[id]:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/testimonials/platform/featured/[id] - Update featured testimonial
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateFeaturedTestimonialSchema.parse(body);

    // Update featured testimonial
    const { data: featuredTestimonial, error: featuredError } = await supabase
      .from('featured_testimonials')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
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
      console.error('Error updating featured testimonial:', featuredError);
      return NextResponse.json(
        { error: 'Failed to update featured testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Featured testimonial updated successfully',
      featuredTestimonial,
    });
  } catch (error) {
    console.error(
      'Error in PUT /api/testimonials/platform/featured/[id]:',
      error
    );

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

// DELETE /api/testimonials/platform/featured/[id] - Delete featured testimonial
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete featured testimonial
    const { error: deleteError } = await supabase
      .from('featured_testimonials')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting featured testimonial:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete featured testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Featured testimonial deleted successfully',
    });
  } catch (error) {
    console.error(
      'Error in DELETE /api/testimonials/platform/featured/[id]:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
