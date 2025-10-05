import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { InquiryStatusResponse, INQUIRY_STATUS } from '@/types/inquiries';

// Validation schemas
const getInquiryStatusSchema = z.object({
  user_id: z.string().uuid().optional(),
  status: z
    .enum(Object.values(INQUIRY_STATUS) as [string, ...string[]])
    .optional(),
});

const updateInquiryStatusSchema = z.object({
  inquiry_id: z.string().uuid('Invalid inquiry ID'),
  status: z.enum(Object.values(INQUIRY_STATUS) as [string, ...string[]]),
  reason: z.string().optional(),
});

// GET /api/inquiries/status - Get inquiry status overview
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = getInquiryStatusSchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { user_id, status } = validationResult.data;

    // Get user role to determine access
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

    // Build query based on user role and filters
    let query = supabase
      .from('inquiries')
      .select(
        `
        id,
        status,
        created_at,
        contractor:contractor_id (
          id,
          profiles!inner (
            first_name,
            last_name
          ),
          business_profiles!inner (
            company_name
          )
        ),
        event_manager:event_manager_id (
          id,
          profiles!inner (
            first_name,
            last_name
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userProfile.role === 'contractor') {
      query = query.eq('contractor_id', user.id);
    } else if (userProfile.role === 'event_manager') {
      query = query.eq('event_manager_id', user.id);
    } else if (userProfile.role === 'admin') {
      // Admins can see all inquiries
      if (user_id) {
        query = query.or(
          `event_manager_id.eq.${user_id},contractor_id.eq.${user_id}`
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: inquiries, error: inquiriesError } = await query;

    if (inquiriesError) {
      console.error('Inquiry status fetch error:', inquiriesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch inquiry status' },
        { status: 500 }
      );
    }

    // Calculate status counts
    const statusCounts = {
      sent: 0,
      viewed: 0,
      responded: 0,
      quoted: 0,
    };

    inquiries?.forEach(inquiry => {
      switch (inquiry.status) {
        case 'sent':
          statusCounts.sent++;
          break;
        case 'viewed':
          statusCounts.viewed++;
          break;
        case 'responded':
          statusCounts.responded++;
          break;
        case 'quoted':
          statusCounts.quoted++;
          break;
      }
    });

    const response: InquiryStatusResponse = {
      inquiries: inquiries || [],
      status_counts: statusCounts,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Inquiry status fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/inquiries/status - Update inquiry status
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

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
    const validationResult = updateInquiryStatusSchema.safeParse(body);

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

    const { inquiry_id, status, reason } = validationResult.data;

    // Get current inquiry
    const { data: currentInquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiry_id)
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
      (userProfile.role === 'contractor' &&
        currentInquiry.contractor_id === user.id) ||
      (userProfile.role === 'event_manager' &&
        currentInquiry.event_manager_id === user.id);

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Update inquiry status
    const { data: updatedInquiry, error: updateError } = await supabase
      .from('inquiries')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inquiry_id)
      .select()
      .single();

    if (updateError) {
      console.error('Inquiry status update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update inquiry status' },
        { status: 500 }
      );
    }

    // TODO: Send notification about status change
    // This would integrate with the notification system

    return NextResponse.json({
      inquiry: updatedInquiry,
      success: true,
      message: 'Inquiry status updated successfully',
    });
  } catch (error) {
    console.error('Inquiry status update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
