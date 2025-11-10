import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';
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
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Handle both Promise and direct params (Next.js 14+ uses Promise)
    let inquiryId: string;
    if (params instanceof Promise) {
      const resolved = await params;
      inquiryId = resolved.id;
    } else {
      inquiryId = params.id;
    }

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
      } = await supabase.auth.getUser();

      if (getUserUser) {
        user = getUserUser;
      }
    }

    // If no user from cookies, try to get from x-user-id header (fallback)
    if (!user) {
      const userIdFromHeaderRaw =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      // Handle case where header might have multiple values (comma-separated)
      // Extract just the first value
      const userIdFromHeader = userIdFromHeaderRaw
        ? userIdFromHeaderRaw.split(',')[0].trim()
        : null;

      if (userIdFromHeader) {
        try {
          // Verify the user exists - use admin client to bypass RLS
          const adminSupabaseForAuth = createServerClient();
          const { data: userData, error: userError } =
            await adminSupabaseForAuth
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
        } catch (err) {
          // Silently fail - will return 401 below
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          details: 'Authentication failed. Please ensure you are logged in.',
        },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS since we need to read enquiries
    const adminSupabase = createServerClient();

    // Fetch enquiry and user role in parallel
    const [enquiryResult, userProfileResult] = await Promise.all([
      adminSupabase.from('enquiries').select('*').eq('id', inquiryId).single(),
      adminSupabase.from('users').select('role').eq('id', user.id).single(),
    ]);

    const { data: enquiry, error: enquiryError } = enquiryResult;
    const { data: userProfile, error: profileError } = userProfileResult;

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      );
    }

    if (enquiryError || !enquiry) {
      return NextResponse.json(
        { success: false, message: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Check access permissions based on user role
    let hasAccess = false;

    if (userProfile.role === 'admin') {
      hasAccess = true;
    } else if (userProfile.role === 'contractor') {
      // For contractors, enquiries.contractor_id references business_profiles.id
      if (enquiry.contractor_id) {
        const { data: businessProfile } = await adminSupabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (businessProfile && enquiry.contractor_id === businessProfile.id) {
          hasAccess = true;
        }
      }
    } else if (userProfile.role === 'event_manager') {
      // Event managers can see enquiries they sent OR enquiries for events they manage
      if (enquiry.sender_id === user.id) {
        hasAccess = true;
      } else if (enquiry.event_id) {
        // Check if user manages this event
        const { data: event } = await adminSupabase
          .from('events')
          .select('user_id')
          .eq('id', enquiry.event_id)
          .single();

        if (event && event.user_id === user.id) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      console.log(
        'Access denied for user:',
        user.id,
        'role:',
        userProfile.role
      );
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch business profile and event manager in parallel
    const [businessProfileResult, eventManagerResult] = await Promise.all([
      enquiry.contractor_id
        ? adminSupabase
            .from('business_profiles')
            .select('id, user_id, company_name')
            .eq('id', enquiry.contractor_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      enquiry.sender_id
        ? adminSupabase
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
            .eq('id', enquiry.sender_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const businessProfile = businessProfileResult.data;
    let eventManager = null;

    if (eventManagerResult.data) {
      const profile = Array.isArray(eventManagerResult.data.profiles)
        ? eventManagerResult.data.profiles[0]
        : eventManagerResult.data.profiles;

      eventManager = {
        id: eventManagerResult.data.id,
        email: eventManagerResult.data.email,
        profiles:
          profile && (profile.first_name || profile.last_name)
            ? {
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                avatar_url: profile.avatar_url || null,
              }
            : null,
      };
    }

    // If still no sender found, create a placeholder
    if (!eventManager) {
      eventManager = {
        id: enquiry.sender_id || 'unknown',
        email: 'Unknown Sender',
        profiles: null,
      };
    }

    // Get enquiry messages (responses) and sender IDs in one query
    const { data: messagesData } = await adminSupabase
      .from('enquiry_messages')
      .select('*')
      .eq('enquiry_id', inquiryId)
      .order('created_at', { ascending: true });

    const messages = messagesData || [];

    // Transform enquiry to match expected inquiry format - same as list route
    const transformedInquiry = {
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

    // Get unique sender IDs from messages
    const senderIds = [
      ...new Set(messages.map((msg: any) => msg.sender_id).filter(Boolean)),
    ];

    // Fetch all responders in parallel
    const responderPromises = senderIds.map((senderId: string) =>
      adminSupabase
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
        .eq('id', senderId)
        .maybeSingle()
    );

    const responderResults = await Promise.all(responderPromises);
    const responderMap = new Map();

    responderResults.forEach((result, index) => {
      if (result.data) {
        const profile = Array.isArray(result.data.profiles)
          ? result.data.profiles[0]
          : result.data.profiles;

        responderMap.set(senderIds[index], {
          id: result.data.id,
          email: result.data.email,
          profiles:
            profile && (profile.first_name || profile.last_name)
              ? {
                  first_name: profile.first_name || '',
                  last_name: profile.last_name || '',
                  avatar_url: profile.avatar_url || null,
                }
              : null,
        });
      }
    });

    // Transform messages to match inquiry_responses format
    const transformedResponses = messages.map((msg: any) => ({
      id: msg.id,
      inquiry_id: msg.enquiry_id,
      responder_id: msg.sender_id,
      response_type: (msg.response_type || 'reply') as any,
      message: msg.message,
      is_template: false,
      created_at: msg.created_at,
      responder: responderMap.get(msg.sender_id) || null,
    }));

    const response: InquiryDetailResponse = {
      inquiry: transformedInquiry as any,
      responses: transformedResponses as any,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('=== INQUIRY FETCH ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error:', error);
    console.error(
      'Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );

    try {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack,
        errorName: error instanceof Error ? error.name : 'Not an Error',
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Internal server error',
          error: errorMessage,
          details:
            process.env.NODE_ENV === 'development' ? errorStack : undefined,
        },
        { status: 500 }
      );
    } catch (jsonError) {
      console.error('Failed to create error response:', jsonError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }
}

// PUT /api/inquiries/[id] - Update an inquiry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = createClient();
    const resolvedParams = params instanceof Promise ? await params : params;
    const inquiryId = resolvedParams.id;

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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = createClient();
    const resolvedParams = params instanceof Promise ? await params : params;
    const inquiryId = resolvedParams.id;

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
