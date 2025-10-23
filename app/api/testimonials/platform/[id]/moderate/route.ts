import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const moderateTestimonialSchema = z.object({
  status: z.enum(['approved', 'rejected', 'flagged']),
  notes: z.string().max(1000).optional(),
});

// POST /api/testimonials/platform/[id]/moderate - Moderate platform testimonial
export async function POST(
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
    const validatedData = moderateTestimonialSchema.parse(body);

    // Get testimonial to verify it exists
    const { data: testimonial, error: testimonialError } = await supabase
      .from('platform_testimonials')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (testimonialError || !testimonial) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    // Update testimonial status
    const updateData: any = {
      status: validatedData.status,
      updated_at: new Date().toISOString(),
    };

    // Set approved_at if approving
    if (validatedData.status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.is_public = true;
    } else {
      updateData.is_public = false;
    }

    const { data: updatedTestimonial, error: updateError } = await supabase
      .from('platform_testimonials')
      .update(updateData)
      .eq('id', params.id)
      .select(
        `
        *,
        user:users!platform_testimonials_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating testimonial:', updateError);
      return NextResponse.json(
        { error: 'Failed to update testimonial' },
        { status: 500 }
      );
    }

    // Create moderation record
    const { error: moderationError } = await supabase
      .from('platform_testimonial_moderation')
      .insert({
        testimonial_id: params.id,
        moderator_id: user.id,
        status: validatedData.status,
        notes: validatedData.notes,
      });

    if (moderationError) {
      console.error('Error creating moderation record:', moderationError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      message: 'Testimonial moderated successfully',
      testimonial: updatedTestimonial,
    });
  } catch (error) {
    console.error(
      'Error in POST /api/testimonials/platform/[id]/moderate:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
