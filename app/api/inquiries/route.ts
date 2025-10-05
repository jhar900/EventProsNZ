import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  CreateInquiryRequest,
  GetInquiriesRequest,
  InquiryResponse,
  InquiryListResponse,
  INQUIRY_TYPES,
  INQUIRY_STATUS,
  INQUIRY_PRIORITY,
} from '@/types/inquiries';
import {
  checkInquiryRateLimit,
  sanitizeInquiryInput,
  validateInquiryInput,
  addSecurityHeaders,
} from '@/lib/middleware/inquiry-rate-limit';

// Validation schemas
const createInquirySchema = z.object({
  contractor_id: z.string().uuid('Invalid contractor ID'),
  event_id: z.string().uuid('Invalid event ID').optional(),
  inquiry_type: z.enum(Object.values(INQUIRY_TYPES) as [string, ...string[]]),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long'),
  event_details: z
    .object({
      event_type: z.string(),
      title: z.string(),
      description: z.string().optional(),
      event_date: z.string().datetime(),
      duration_hours: z.number().min(0).max(168).optional(),
      attendee_count: z.number().min(1).max(10000).optional(),
      location: z.object({
        address: z.string(),
        coordinates: z
          .object({
            lat: z.number(),
            lng: z.number(),
          })
          .optional(),
        placeId: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
        country: z.string().optional(),
      }),
      budget_total: z.number().min(0).optional(),
      special_requirements: z.string().optional(),
      service_requirements: z
        .array(
          z.object({
            category: z.string(),
            type: z.string(),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high']),
            estimated_budget: z.number().min(0).optional(),
            is_required: z.boolean(),
          })
        )
        .optional(),
    })
    .optional(),
  priority: z
    .enum(Object.values(INQUIRY_PRIORITY) as [string, ...string[]])
    .optional()
    .default('medium'),
});

const getInquiriesSchema = z.object({
  user_id: z.string().uuid().optional(),
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

// POST /api/inquiries - Create a new inquiry
export async function POST(request: NextRequest) {
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

    // Check rate limit
    const rateLimitResponse = await checkInquiryRateLimit(request, user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse and validate request body
    const body = await request.json();

    // Sanitize input
    const sanitizedBody = sanitizeInquiryInput(body);

    // Additional validation
    const validationResult = validateInquiryInput(sanitizedBody);
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors.map(error => ({ message: error })),
        },
        { status: 400 }
      );
    }

    const zodValidationResult = createInquirySchema.safeParse(sanitizedBody);
    if (!zodValidationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors:
            zodValidationResult.error.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const inquiryData = zodValidationResult.data;

    // Check if user is an event manager
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'event_manager') {
      return NextResponse.json(
        { success: false, message: 'Only event managers can create inquiries' },
        { status: 403 }
      );
    }

    // Verify contractor exists and is verified
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', inquiryData.contractor_id)
      .eq('role', 'contractor')
      .single();

    if (contractorError || !contractor || !contractor.is_verified) {
      return NextResponse.json(
        { success: false, message: 'Contractor not found or not verified' },
        { status: 404 }
      );
    }

    // Verify event exists if provided
    if (inquiryData.event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, event_manager_id')
        .eq('id', inquiryData.event_id)
        .eq('event_manager_id', user.id)
        .single();

      if (eventError || !event) {
        return NextResponse.json(
          { success: false, message: 'Event not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Create inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        event_manager_id: user.id,
        contractor_id: inquiryData.contractor_id,
        event_id: inquiryData.event_id,
        inquiry_type: inquiryData.inquiry_type,
        subject: inquiryData.subject,
        message: inquiryData.message,
        event_details: inquiryData.event_details,
        priority: inquiryData.priority,
        status: 'sent',
      })
      .select()
      .single();

    if (inquiryError) {
      console.error('Inquiry creation error:', inquiryError);
      return NextResponse.json(
        { success: false, message: 'Failed to create inquiry' },
        { status: 500 }
      );
    }

    const response: InquiryResponse = {
      inquiry,
      success: true,
      message: 'Inquiry created successfully',
    };

    const nextResponse = NextResponse.json(response, { status: 201 });
    return await addSecurityHeaders(nextResponse);
  } catch (error) {
    console.error('Inquiry creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/inquiries - Get inquiries with filtering and pagination
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
    const validationResult = getInquiriesSchema.safeParse(queryParams);

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

    const { user_id, status, inquiry_type, priority, page, limit } =
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

    // Build query based on user role
    let query = supabase
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
      console.error('Inquiries fetch error:', inquiriesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch inquiries' },
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

    const nextResponse = NextResponse.json(response);
    return await addSecurityHeaders(nextResponse);
  } catch (error) {
    console.error('Inquiries fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
