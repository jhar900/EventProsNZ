import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';
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
    const { supabase } = createClient(request);

    // Get current user - try session first, then fallback to getUser
    let user: any;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (session?.user) {
      user = session.user;
    } else {
      // Fallback to getUser
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (getUserUser) {
        user = getUserUser;
      }
    }

    // If no user from cookies, try to get from x-user-id header (fallback)
    if (!user) {
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      if (userIdFromHeader) {
        // Verify the user exists - use admin client to bypass RLS
        const adminSupabaseForAuth = createServerClient();
        const { data: userData, error: userError } = await adminSupabaseForAuth
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        if (!userError && userData) {
          // Create a minimal user object
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
        }
      }
    }

    if (!user) {
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

    // Use admin client to bypass RLS since we need to read enquiries
    const adminSupabase = createServerClient();

    // Get user role to determine access
    const { data: userProfile, error: profileError } = await adminSupabase
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
    // Use enquiries table (not inquiries) - it has a simpler schema
    // enquiries.contractor_id references business_profiles.id

    // First, try a simple query without relations to see if the table exists
    let query = adminSupabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userProfile.role === 'contractor') {
      // For contractors, enquiries.contractor_id references business_profiles.id
      // So we need to find the business_profile for this user first
      const { data: businessProfile } = await adminSupabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (businessProfile) {
        query = query.eq('contractor_id', businessProfile.id);
      } else {
        // No business profile found, return empty
        query = query.eq(
          'contractor_id',
          '00000000-0000-0000-0000-000000000000'
        );
      }
    } else if (userProfile.role === 'event_manager') {
      // Event managers: enquiries table doesn't have event_manager_id
      // Instead, we'll filter by event.event_manager_id if events are linked
      // For now, we'll show all enquiries that have events they manage
      // Or we could add a sender_id field later
      // For now, just show all enquiries for event managers (they created the events)
      const { data: userEvents } = await adminSupabase
        .from('events')
        .select('id')
        .eq('event_manager_id', user.id);

      if (userEvents && userEvents.length > 0) {
        const eventIds = userEvents.map(e => e.id);
        query = query.in('event_id', eventIds);
      } else {
        // No events found, return empty
        query = query.eq('event_id', '00000000-0000-0000-0000-000000000000');
      }
    } else if (userProfile.role === 'admin') {
      // Admins can see all enquiries
      // No filtering needed
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

    // Note: enquiries table doesn't have inquiry_type or priority fields
    // These filters are ignored for enquiries table

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    console.log(
      'Executing enquiries query for user:',
      user.id,
      'Role:',
      userProfile.role
    );
    const { data: enquiries, error: inquiriesError, count } = await query;
    console.log('Enquiries query result:', {
      count: enquiries?.length,
      error: inquiriesError?.message,
      errorCode: inquiriesError?.code,
      errorDetails: inquiriesError?.details,
      hint: inquiriesError?.hint,
    });

    if (inquiriesError) {
      console.error('Inquiries fetch error:', inquiriesError);
      console.error(
        'Full error object:',
        JSON.stringify(inquiriesError, null, 2)
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch inquiries',
          error:
            inquiriesError.message || inquiriesError.details || 'Unknown error',
          error_code: inquiriesError.code,
          error_hint: inquiriesError.hint,
          error_details: inquiriesError.details,
        },
        { status: 500 }
      );
    }

    // Transform enquiries to match the expected inquiry format
    // Fetch related data separately since we simplified the query
    const transformedInquiries = await Promise.all(
      (enquiries || []).map(async (enquiry: any) => {
        let businessProfile = null;
        let eventManager = null;

        // Fetch business profile for contractor_id
        if (enquiry.contractor_id) {
          const { data: bp } = await adminSupabase
            .from('business_profiles')
            .select('id, user_id, company_name')
            .eq('id', enquiry.contractor_id)
            .single();
          businessProfile = bp;
        }

        // Try to get sender from event if available
        if (enquiry.event_id) {
          // Fetch event to get event_manager_id
          const { data: event } = await adminSupabase
            .from('events')
            .select('id, event_manager_id, title, event_type, event_date')
            .eq('id', enquiry.event_id)
            .single();

          if (event?.event_manager_id) {
            // Fetch the event manager profile
            const { data: eventManagerData } = await adminSupabase
              .from('users')
              .select(
                `
                id,
                email,
                profiles (
                  first_name,
                  last_name,
                  avatar_url
                )
              `
              )
              .eq('id', event.event_manager_id)
              .single();

            if (eventManagerData) {
              const profile = Array.isArray(eventManagerData.profiles)
                ? eventManagerData.profiles[0]
                : eventManagerData.profiles;
              eventManager = {
                id: eventManagerData.id,
                email: eventManagerData.email,
                profiles: profile
                  ? {
                      first_name: profile.first_name,
                      last_name: profile.last_name,
                      avatar_url: profile.avatar_url,
                    }
                  : null,
              };
            }
          }
        }

        // If no event manager found, create a placeholder
        if (!eventManager) {
          eventManager = {
            id: 'unknown',
            email: 'Unknown',
            profiles: null,
          };
        }

        return {
          ...enquiry,
          // Map to match expected structure
          contractor_id: businessProfile?.user_id || enquiry.contractor_id,
          event_manager: eventManager,
          // Map status - enquiries uses 'pending', 'responded', 'closed', 'archived'
          // Map 'pending' to 'sent' to match component expectations
          status: enquiry.status === 'pending' ? 'sent' : enquiry.status,
          // enquiries table doesn't have these fields
          inquiry_type: 'general',
          priority: 'medium',
        };
      })
    );

    const response: InquiryListResponse = {
      inquiries: transformedInquiries || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    };

    const nextResponse = NextResponse.json(response);
    return await addSecurityHeaders(nextResponse);
  } catch (error) {
    console.error('Inquiries fetch error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch inquiries',
        error: errorMessage,
        details:
          process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
