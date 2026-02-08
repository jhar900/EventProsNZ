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
  date_from: z.string().optional(),
  date_to: z.string().optional(),
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

    const {
      user_id,
      status,
      inquiry_type,
      priority,
      date_from,
      date_to,
      page,
      limit,
    } = validationResult.data;
    const offset = (page - 1) * limit;

    // Use admin client to bypass RLS since we need to read enquiries
    const adminSupabase = createServerClient();

    // Get user role and role-specific data in parallel
    const [userProfileResult, businessProfileResult, userEventsResult] =
      await Promise.all([
        adminSupabase.from('users').select('role').eq('id', user.id).single(),
        adminSupabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle(),
        adminSupabase.from('events').select('id').eq('user_id', user.id),
      ]);

    const { data: userProfile, error: profileError } = userProfileResult;
    const { data: businessProfile } = businessProfileResult;
    const { data: userEvents } = userEventsResult;

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Build query based on user role
    let query = adminSupabase
      .from('enquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (userProfile.role === 'contractor') {
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
      if (userEvents && userEvents.length > 0) {
        const eventIds = userEvents.map(e => e.id);
        query = query.or(
          `sender_id.eq.${user.id},event_id.in.(${eventIds.join(',')})`
        );
      } else {
        query = query.eq('sender_id', user.id);
      }
    } else if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    // Apply date filters
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    if (date_to) {
      // Add one day to include the entire end date
      const endDate = new Date(date_to);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', endDate.toISOString());
    }

    // Note: enquiries table doesn't have inquiry_type or priority fields
    // These filters are ignored for enquiries table

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: enquiries, error: inquiriesError, count } = await query;

    if (inquiriesError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch inquiries',
          error:
            inquiriesError.message || inquiriesError.details || 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Batch fetch all related data
    const enquiriesList = enquiries || [];

    // Collect all unique IDs we need to fetch
    const contractorIds = [
      ...new Set(
        enquiriesList.map((e: any) => e.contractor_id).filter((id: any) => id)
      ),
    ];
    const senderIds = [
      ...new Set(
        enquiriesList.map((e: any) => e.sender_id).filter((id: any) => id)
      ),
    ];
    const eventIds = [
      ...new Set(
        enquiriesList.map((e: any) => e.event_id).filter((id: any) => id)
      ),
    ];

    // Fetch all related data in parallel
    const [
      businessProfilesResult,
      sendersResult,
      eventsResult,
      senderBusinessProfilesResult,
    ] = await Promise.all([
      contractorIds.length > 0
        ? adminSupabase
            .from('business_profiles')
            .select('id, user_id, company_name')
            .in('id', contractorIds)
        : Promise.resolve({ data: [], error: null }),
      senderIds.length > 0
        ? adminSupabase
            .from('users')
            .select(
              `
                id,
                email,
                profiles (
                  first_name,
                  last_name,
                  avatar_url,
                  phone
                )
              `
            )
            .in('id', senderIds)
        : Promise.resolve({ data: [], error: null }),
      eventIds.length > 0
        ? adminSupabase
            .from('events')
            .select('id, title, event_type, event_date, location, user_id')
            .in('id', eventIds)
        : Promise.resolve({ data: [], error: null }),
      // Fetch business profiles for senders (to check if they have published contractor profiles)
      senderIds.length > 0
        ? adminSupabase
            .from('business_profiles')
            .select('id, user_id, is_published')
            .in('user_id', senderIds)
            .eq('is_published', true)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Get contractor user IDs from business profiles
    const contractorUserIds = [
      ...new Set(
        (businessProfilesResult.data || [])
          .map((bp: any) => bp.user_id)
          .filter((id: any) => id)
      ),
    ];

    // Fetch contractor user profiles
    const contractorProfilesResult =
      contractorUserIds.length > 0
        ? await adminSupabase
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
            .in('id', contractorUserIds)
        : { data: [], error: null };

    // Create lookup maps
    const businessProfileMap = new Map(
      (businessProfilesResult.data || []).map((bp: any) => [bp.id, bp])
    );

    // Create a map of sender user IDs to their published business profile IDs
    const senderBusinessProfileMap = new Map(
      (senderBusinessProfilesResult.data || []).map((bp: any) => [
        bp.user_id,
        bp.id,
      ])
    );

    const senderMap = new Map(
      (sendersResult.data || []).map((sender: any) => {
        const profile = Array.isArray(sender.profiles)
          ? sender.profiles[0]
          : sender.profiles;
        const publishedProfileId = senderBusinessProfileMap.get(sender.id);
        return [
          sender.id,
          {
            id: sender.id,
            email: sender.email,
            profiles:
              profile && (profile.first_name || profile.last_name)
                ? {
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    avatar_url: profile.avatar_url || null,
                    phone: profile.phone || null,
                  }
                : null,
            published_profile_id: publishedProfileId || null,
          },
        ];
      })
    );

    // Create contractor profile map
    const contractorProfileMap = new Map(
      (contractorProfilesResult.data || []).map((contractor: any) => {
        const profile = Array.isArray(contractor.profiles)
          ? contractor.profiles[0]
          : contractor.profiles;
        return [
          contractor.id,
          {
            id: contractor.id,
            email: contractor.email,
            profiles:
              profile && (profile.first_name || profile.last_name)
                ? {
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    avatar_url: profile.avatar_url || null,
                  }
                : null,
          },
        ];
      })
    );

    const eventMap = new Map(
      (eventsResult.data || []).map((event: any) => [event.id, event])
    );

    // Transform enquiries using the lookup maps
    const transformedInquiries = enquiriesList.map((enquiry: any) => {
      const businessProfile = enquiry.contractor_id
        ? businessProfileMap.get(enquiry.contractor_id)
        : null;

      // Get contractor user data
      const contractorUserId = businessProfile?.user_id;
      const contractor = contractorUserId
        ? contractorProfileMap.get(contractorUserId)
        : null;

      // Get sender from sender_id (primary)
      let eventManager = enquiry.sender_id
        ? senderMap.get(enquiry.sender_id)
        : null;

      // Fallback: Try to get sender from event
      if (!eventManager && enquiry.event_id) {
        const event = eventMap.get(enquiry.event_id);
        if (event?.user_id) {
          eventManager = senderMap.get(event.user_id);
        }
      }

      // If still no sender found, create a placeholder
      if (!eventManager) {
        eventManager = {
          id: enquiry.sender_id || 'unknown',
          email: 'Unknown Sender',
          profiles: null,
          published_profile_id: null,
        };
      }

      // Get event data
      const event = enquiry.event_id ? eventMap.get(enquiry.event_id) : null;

      return {
        ...enquiry,
        contractor_id: contractorUserId || enquiry.contractor_id,
        contractor: contractor
          ? {
              id: contractor.id,
              email: contractor.email,
              profiles: contractor.profiles,
              business_profiles: businessProfile
                ? {
                    company_name: businessProfile.company_name,
                  }
                : null,
            }
          : null,
        event_manager: eventManager,
        event: event
          ? {
              id: event.id,
              title: event.title,
              event_type: event.event_type,
              event_date: event.event_date,
              location: event.location,
            }
          : null,
        status: enquiry.status === 'pending' ? 'sent' : enquiry.status,
        inquiry_type: 'general',
        priority: 'medium',
      };
    });

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
