import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const getModerationSchema = z.object({
  status: z.string().optional(),
  moderator_id: z.string().uuid().optional(),
  page: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 1),
  limit: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 10),
});

const moderationActionSchema = z.object({
  testimonial_id: z.string().uuid(),
  moderation_status: z.enum(['pending', 'approved', 'rejected', 'flagged']),
  moderation_notes: z.string().max(1000).optional(),
});

// GET /api/testimonials/moderation - Get testimonials for moderation
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

    // Check if user is admin or moderator
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !['admin', 'moderator'].includes(userData?.role || '')) {
      return NextResponse.json(
        { error: 'Only admins and moderators can access moderation' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = getModerationSchema.parse(queryParams);

    // Build query for testimonials needing moderation
    let query = supabase.from('testimonials').select(`
        *,
        contractor:users!testimonials_contractor_id_fkey(id, first_name, last_name, company_name),
        event_manager:users!testimonials_event_manager_id_fkey(id, first_name, last_name),
        inquiry:inquiries(id, subject, status, created_at),
        moderation:testimonial_moderation(
          id,
          moderation_status,
          moderation_notes,
          moderated_at,
          moderator:users!testimonial_moderation_moderator_id_fkey(id, first_name, last_name)
        )
      `);

    // Apply filters
    if (validatedParams.status) {
      query = query.eq('moderation.moderation_status', validatedParams.status);
    }
    if (validatedParams.moderator_id) {
      query = query.eq('moderation.moderator_id', validatedParams.moderator_id);
    }

    // Apply pagination
    const offset = (validatedParams.page - 1) * validatedParams.limit;
    query = query
      .range(offset, offset + validatedParams.limit - 1)
      .order('created_at', { ascending: false });

    const { data: testimonials, error: testimonialsError, count } = await query;

    if (testimonialsError) {
      console.error(
        'Error fetching testimonials for moderation:',
        testimonialsError
      );
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

    console.error('Error in GET /api/testimonials/moderation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/testimonials/moderation - Moderate testimonial
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

    // Check if user is admin or moderator
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !['admin', 'moderator'].includes(userData?.role || '')) {
      return NextResponse.json(
        { error: 'Only admins and moderators can moderate testimonials' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = moderationActionSchema.parse(body);

    // Check if testimonial exists
    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .select('id, is_approved')
      .eq('id', validatedData.testimonial_id)
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

    // Create moderation record
    const { data: moderation, error: moderationError } = await supabase
      .from('testimonial_moderation')
      .insert({
        testimonial_id: validatedData.testimonial_id,
        moderator_id: user.id,
        moderation_status: validatedData.moderation_status,
        moderation_notes: validatedData.moderation_notes,
      })
      .select()
      .single();

    if (moderationError) {
      console.error('Error creating moderation record:', moderationError);
      return NextResponse.json(
        { error: 'Failed to create moderation record' },
        { status: 500 }
      );
    }

    // Update testimonial based on moderation status
    let testimonialUpdate: any = {};

    if (validatedData.moderation_status === 'approved') {
      testimonialUpdate.is_approved = true;
      testimonialUpdate.is_public = true;
    } else if (validatedData.moderation_status === 'rejected') {
      testimonialUpdate.is_approved = false;
      testimonialUpdate.is_public = false;
    } else if (validatedData.moderation_status === 'flagged') {
      testimonialUpdate.is_approved = false;
      testimonialUpdate.is_public = false;
    }

    if (Object.keys(testimonialUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('testimonials')
        .update(testimonialUpdate)
        .eq('id', validatedData.testimonial_id);

      if (updateError) {
        console.error('Error updating testimonial:', updateError);
        return NextResponse.json(
          { error: 'Failed to update testimonial' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      moderation,
      success: true,
      message: `Testimonial ${validatedData.moderation_status} successfully`,
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

    console.error('Error in POST /api/testimonials/moderation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
