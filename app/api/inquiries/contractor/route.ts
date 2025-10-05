import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  InquiryListResponse,
  INQUIRY_STATUS,
  INQUIRY_TYPES,
  INQUIRY_PRIORITY,
} from '@/types/inquiries';

// Validation schemas
const getContractorInquiriesSchema = z.object({
  contractor_id: z.string().uuid('Invalid contractor ID'),
  status: z
    .enum(Object.values(INQUIRY_STATUS) as [string, ...string[]])
    .optional(),
  inquiry_type: z
    .enum(Object.values(INQUIRY_TYPES) as [string, ...string[]])
    .optional(),
  priority: z
    .enum(Object.values(INQUIRY_PRIORITY) as [string, ...string[]])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// GET /api/inquiries/contractor - Get inquiries for a specific contractor
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
    const validationResult =
      getContractorInquiriesSchema.safeParse(queryParams);

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

    const { contractor_id, status, inquiry_type, priority, page, limit } =
      validationResult.data;
    const offset = (page - 1) * limit;

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

    // Check access permissions
    const canAccess =
      userProfile.role === 'admin' ||
      (userProfile.role === 'contractor' && user.id === contractor_id);

    if (!canAccess) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Verify contractor exists
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', contractor_id)
      .eq('role', 'contractor')
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { success: false, message: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Build query for contractor inquiries
    let query = supabase
      .from('inquiries')
      .select(
        `
        *,
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
          event_date,
          location
        )
      `
      )
      .eq('contractor_id', contractor_id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (inquiry_type) {
      query = query.eq('inquiry_type', inquiry_type);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: inquiries, error: inquiriesError, count } = await query;

    if (inquiriesError) {
      console.error('Contractor inquiries fetch error:', inquiriesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch contractor inquiries' },
        { status: 500 }
      );
    }

    const response: InquiryListResponse = {
      inquiries: inquiries || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Contractor inquiries fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
