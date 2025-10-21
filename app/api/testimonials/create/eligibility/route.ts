import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const eligibilitySchema = z.object({
  contractor_id: z.string().uuid(),
  event_manager_id: z.string().uuid(),
});

// GET /api/testimonials/create/eligibility - Check if user can create testimonial
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
    const validatedParams = eligibilitySchema.parse(queryParams);

    // Verify user is event manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'event_manager') {
      return NextResponse.json({
        eligible: false,
        reason: 'Only event managers can create testimonials',
      });
    }

    // Check if user is trying to create testimonial for themselves
    if (validatedParams.event_manager_id !== user.id) {
      return NextResponse.json({
        eligible: false,
        reason: 'You can only create testimonials for your own inquiries',
      });
    }

    // Check if contractor exists and is verified
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', validatedParams.contractor_id)
      .eq('role', 'contractor')
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json({
        eligible: false,
        reason: 'Contractor not found or not verified',
      });
    }

    if (!contractor.is_verified) {
      return NextResponse.json({
        eligible: false,
        reason: 'Contractor is not verified',
      });
    }

    // Check if user has made inquiries to this contractor
    const { data: inquiries, error: inquiriesError } = await supabase
      .from('inquiries')
      .select('id, status, created_at')
      .eq('contractor_id', validatedParams.contractor_id)
      .eq('event_manager_id', validatedParams.event_manager_id)
      .order('created_at', { ascending: false });

    if (inquiriesError) {
      console.error('Error fetching inquiries:', inquiriesError);
      return NextResponse.json({
        eligible: false,
        reason: 'Error checking inquiry history',
      });
    }

    if (!inquiries || inquiries.length === 0) {
      return NextResponse.json({
        eligible: false,
        reason:
          'You must have made an inquiry to this contractor before creating a testimonial',
      });
    }

    // Find the most recent inquiry that's in a valid state for testimonial
    const validInquiry = inquiries.find(inquiry =>
      ['responded', 'quoted', 'closed'].includes(inquiry.status)
    );

    if (!validInquiry) {
      return NextResponse.json({
        eligible: false,
        reason:
          'You can only create testimonials for inquiries that have been responded to',
      });
    }

    // Check if testimonial already exists for this inquiry
    const { data: existingTestimonial, error: existingError } = await supabase
      .from('testimonials')
      .select('id, is_approved')
      .eq('inquiry_id', validInquiry.id)
      .single();

    if (existingTestimonial) {
      return NextResponse.json({
        eligible: false,
        reason: 'Testimonial already exists for this inquiry',
        inquiry_id: validInquiry.id,
      });
    }

    return NextResponse.json({
      eligible: true,
      inquiry_id: validInquiry.id,
      contractor_name: contractor.first_name + ' ' + contractor.last_name,
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

    console.error('Error in GET /api/testimonials/create/eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
