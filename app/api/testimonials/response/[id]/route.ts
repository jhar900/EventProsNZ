import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const updateResponseSchema = z.object({
  response_text: z.string().min(10).max(2000).optional(),
  is_approved: z.boolean().optional(),
  is_public: z.boolean().optional(),
});

// PUT /api/testimonials/response/[id] - Update testimonial response
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
    const validatedData = updateResponseSchema.parse(body);

    // Check if response exists and user has permission to update
    const { data: existingResponse, error: existingError } = await supabase
      .from('testimonial_responses')
      .select('id, contractor_id, is_approved')
      .eq('id', params.id)
      .single();

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Response not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching response:', existingError);
      return NextResponse.json(
        { error: 'Failed to fetch response' },
        { status: 500 }
      );
    }

    // Check if user is the contractor or admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = existingResponse.contractor_id === user.id;
    const isAdmin = userData?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only update your own responses' },
        { status: 403 }
      );
    }

    // If updating text, check if response is already approved
    if (validatedData.response_text && existingResponse.is_approved) {
      return NextResponse.json(
        { error: 'Cannot update approved responses' },
        { status: 403 }
      );
    }

    // Update response
    const { data: response, error: responseError } = await supabase
      .from('testimonial_responses')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (responseError) {
      console.error('Error updating response:', responseError);
      return NextResponse.json(
        { error: 'Failed to update response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response,
      success: true,
      message: 'Response updated successfully',
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

    console.error('Error in PUT /api/testimonials/response/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
