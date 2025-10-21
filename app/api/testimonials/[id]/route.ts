import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const updateTestimonialSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  review_text: z.string().min(10).max(2000).optional(),
});

// GET /api/testimonials/[id] - Get specific testimonial
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

    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .select(
        `
        *,
        contractor:users!testimonials_contractor_id_fkey(id, first_name, last_name, profile_photo_url),
        event_manager:users!testimonials_event_manager_id_fkey(id, first_name, last_name, profile_photo_url),
        inquiry:inquiries(id, subject, created_at),
        response:testimonial_responses(id, response_text, is_approved, is_public, created_at)
      `
      )
      .eq('id', params.id)
      .single();

    if (testimonialError) {
      if (testimonialError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Testimonial not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching testimonial:', testimonialError);
      return NextResponse.json(
        { error: 'Failed to fetch testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testimonial,
      response: testimonial.response || null,
    });
  } catch (error) {
    console.error('Error in GET /api/testimonials/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/testimonials/[id] - Update testimonial
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTestimonialSchema.parse(body);

    // Check if testimonial exists and user has permission to update
    const { data: existingTestimonial, error: existingError } = await supabase
      .from('testimonials')
      .select('event_manager_id, is_approved')
      .eq('id', params.id)
      .single();

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Testimonial not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching testimonial:', existingError);
      return NextResponse.json(
        { error: 'Failed to fetch testimonial' },
        { status: 500 }
      );
    }

    // Check if user is the event manager who created the testimonial
    if (existingTestimonial.event_manager_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only update your own testimonials' },
        { status: 403 }
      );
    }

    // Check if testimonial is already approved (cannot be updated)
    if (existingTestimonial.is_approved) {
      return NextResponse.json(
        { error: 'Cannot update approved testimonials' },
        { status: 403 }
      );
    }

    // Update testimonial
    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (testimonialError) {
      console.error('Error updating testimonial:', testimonialError);
      return NextResponse.json(
        { error: 'Failed to update testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testimonial,
      success: true,
    });
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

    console.error('Error in PUT /api/testimonials/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/testimonials/[id] - Delete testimonial
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

    // Check if testimonial exists and user has permission to delete
    const { data: existingTestimonial, error: existingError } = await supabase
      .from('testimonials')
      .select('event_manager_id, is_approved')
      .eq('id', params.id)
      .single();

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Testimonial not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching testimonial:', existingError);
      return NextResponse.json(
        { error: 'Failed to fetch testimonial' },
        { status: 500 }
      );
    }

    // Check if user is the event manager who created the testimonial or admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = existingTestimonial.event_manager_id === user.id;
    const isAdmin = userData?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own testimonials' },
        { status: 403 }
      );
    }

    // Delete testimonial
    const { error: deleteError } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting testimonial:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in DELETE /api/testimonials/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
