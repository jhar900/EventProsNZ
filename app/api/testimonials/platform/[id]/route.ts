import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const updatePlatformTestimonialSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().min(10).max(2000).optional(),
});

// GET /api/testimonials/platform/[id] - Get specific platform testimonial
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

    // Get testimonial
    const { data: testimonial, error: testimonialError } = await supabase
      .from('platform_testimonials')
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
      .eq('id', params.id)
      .single();

    if (testimonialError || !testimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Check if user can view this testimonial
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = !userError && userData?.role === 'admin';
    const isOwner = testimonial.user_id === user.id;

    if (
      !isAdmin &&
      !isOwner &&
      (!testimonial.is_public || testimonial.status !== 'approved')
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error('Error in GET /api/testimonials/platform/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/testimonials/platform/[id] - Update platform testimonial
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
    const validatedData = updatePlatformTestimonialSchema.parse(body);

    // Get testimonial to check ownership
    const { data: testimonial, error: testimonialError } = await supabase
      .from('platform_testimonials')
      .select('user_id, status')
      .eq('id', params.id)
      .single();

    if (testimonialError || !testimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Check if user owns this testimonial
    if (testimonial.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if testimonial can be updated
    if (testimonial.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot update approved testimonial' },
        { status: 403 }
      );
    }

    // Update testimonial
    const { data: updatedTestimonial, error: updateError } = await supabase
      .from('platform_testimonials')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
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

    if (updateError) {
      console.error('Error updating platform testimonial:', updateError);
      return NextResponse.json(
        { error: 'Failed to update testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Testimonial updated successfully',
      testimonial: updatedTestimonial,
    });
  } catch (error) {
    console.error('Error in PUT /api/testimonials/platform/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/testimonials/platform/[id] - Delete platform testimonial
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

    // Get testimonial to check ownership
    const { data: testimonial, error: testimonialError } = await supabase
      .from('platform_testimonials')
      .select('user_id, status')
      .eq('id', params.id)
      .single();

    if (testimonialError || !testimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Check if user owns this testimonial
    if (testimonial.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete testimonial
    const { error: deleteError } = await supabase
      .from('platform_testimonials')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting platform testimonial:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete testimonial' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/testimonials/platform/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
