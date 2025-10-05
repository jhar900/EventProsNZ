import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  UpdateInquiryRequest,
  InquiryDetailResponse,
  INQUIRY_STATUS,
  INQUIRY_PRIORITY,
} from '@/types/inquiries';

// Validation schemas
const updateInquirySchema = z.object({
  status: z
    .enum(Object.values(INQUIRY_STATUS) as [string, ...string[]])
    .optional(),
  priority: z
    .enum(Object.values(INQUIRY_PRIORITY) as [string, ...string[]])
    .optional(),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long')
    .optional(),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long')
    .optional(),
});

// GET /api/inquiries/[id] - Get a specific inquiry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const inquiryId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get inquiry with related data
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select(
        `
        *,
        contractor:contractor_id (
          id,
          email,
          profiles!inner (
            first_name,
            last_name,
            avatar_url
          ),
          business_profiles!inner (
            company_name,
            average_rating,
            review_count
          )
        ),
        event_manager:event_manager_id (
          id,
          email,
          profiles!inner (
            first_name,
            last_name,
            avatar_url
          )
        ),
        event:event_id (
          id,
          title,
          event_type,
          event_date
        )
      `
      )
      .eq('id', inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        { success: false, message: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this inquiry
    const hasAccess =
      userProfile.role === 'admin' ||
      inquiry.event_manager_id === user.id ||
      inquiry.contractor_id === user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get inquiry responses if any
    const { data: responses, error: responsesError } = await supabase
      .from('inquiry_responses')
      .select(
        `
        *,
        responder:responder_id (
          id,
          email,
          profiles!inner (
            first_name,
            last_name,
            avatar_url
          )
        )
      `
      )
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Responses fetch error:', responsesError);
    }

    const response: InquiryDetailResponse = {
      inquiry,
      responses: responses || [],
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Inquiry fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/inquiries/[id] - Update an inquiry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const inquiryId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateInquirySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Get current inquiry
    const { data: currentInquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();

    if (inquiryError || !currentInquiry) {
      return NextResponse.json(
        { success: false, message: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Get user role and check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check update permissions
    const canUpdate =
      userProfile.role === 'admin' ||
      (userProfile.role === 'event_manager' &&
        currentInquiry.event_manager_id === user.id) ||
      (userProfile.role === 'contractor' &&
        currentInquiry.contractor_id === user.id);

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Contractors can only update status and priority
    if (
      userProfile.role === 'contractor' &&
      (updateData.subject || updateData.message)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Contractors can only update status and priority',
        },
        { status: 403 }
      );
    }

    // Update inquiry
    const { data: updatedInquiry, error: updateError } = await supabase
      .from('inquiries')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inquiryId)
      .select()
      .single();

    if (updateError) {
      console.error('Inquiry update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update inquiry' },
        { status: 500 }
      );
    }

    const response = {
      inquiry: updatedInquiry,
      success: true,
      message: 'Inquiry updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Inquiry update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/inquiries/[id] - Delete an inquiry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const inquiryId = params.id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current inquiry
    const { data: currentInquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();

    if (inquiryError || !currentInquiry) {
      return NextResponse.json(
        { success: false, message: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Get user role and check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check delete permissions (only event managers and admins can delete)
    const canDelete =
      userProfile.role === 'admin' ||
      (userProfile.role === 'event_manager' &&
        currentInquiry.event_manager_id === user.id);

    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete inquiry (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', inquiryId);

    if (deleteError) {
      console.error('Inquiry deletion error:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete inquiry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry deleted successfully',
    });
  } catch (error) {
    console.error('Inquiry deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
