import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const approveSchema = z.object({
  is_approved: z.boolean(),
  is_public: z.boolean().optional(),
});

// PUT /api/testimonials/[id]/approve - Approve/reject testimonial
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

    // Check if user is admin or moderator
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !['admin', 'moderator'].includes(userData?.role || '')) {
      return NextResponse.json(
        { error: 'Only admins and moderators can approve testimonials' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = approveSchema.parse(body);

    // Check if testimonial exists
    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .select('id, is_approved, contractor_id')
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

    // Update testimonial
    const updateData: any = {
      is_approved: validatedData.is_approved,
    };

    if (validatedData.is_public !== undefined) {
      updateData.is_public = validatedData.is_public;
    } else {
      // If not specified, set is_public based on is_approved
      updateData.is_public = validatedData.is_approved;
    }

    const { data: updatedTestimonial, error: updateError } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', params.id)
      .select()
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
      .from('testimonial_moderation')
      .insert({
        testimonial_id: params.id,
        moderator_id: user.id,
        moderation_status: validatedData.is_approved ? 'approved' : 'rejected',
        moderation_notes: validatedData.is_approved
          ? 'Testimonial approved for public display'
          : 'Testimonial rejected',
      });

    if (moderationError) {
      console.error('Error creating moderation record:', moderationError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      testimonial: updatedTestimonial,
      success: true,
      message: `Testimonial ${validatedData.is_approved ? 'approved' : 'rejected'} successfully`,
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

    console.error('Error in PUT /api/testimonials/[id]/approve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
