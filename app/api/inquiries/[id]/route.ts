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
    console.log('GET /api/inquiries/[id] called');

    // Handle both Promise and direct params (Next.js 14+ uses Promise)
    let inquiryId: string;
    if (params instanceof Promise) {
      const resolved = await params;
      inquiryId = resolved.id;
    } else {
      inquiryId = params.id;
    }

    console.log('Resolved inquiryId:', inquiryId);

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

    // Fetch enquiry first, then check permissions
    console.log('Fetching enquiry with id:', inquiryId);
    const { data: enquiry, error: enquiryError } = await adminSupabase
      .from('enquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();

    if (enquiryError || !enquiry) {
      console.error('Enquiry fetch error:', enquiryError);
      return NextResponse.json(
        { success: false, message: 'Inquiry not found' },
        { status: 404 }
      );
    }

    console.log('Found enquiry:', {
      id: enquiry.id,
      contractor_id: enquiry.contractor_id,
      sender_id: enquiry.sender_id,
      event_id: enquiry.event_id,
    });

    // Check access permissions based on user role
    let hasAccess = false;

    if (userProfile.role === 'admin') {
      hasAccess = true;
    } else if (userProfile.role === 'contractor') {
      // For contractors, enquiries.contractor_id references business_profiles.id
      const { data: businessProfile, error: bpError } = await adminSupabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (bpError) {
        console.error('Error fetching business profile:', bpError);
      }

      if (businessProfile && enquiry.contractor_id === businessProfile.id) {
        hasAccess = true;
      }
    } else if (userProfile.role === 'event_manager') {
      // Event managers can see enquiries they sent OR enquiries for events they manage
      if (enquiry.sender_id === user.id) {
        hasAccess = true;
      } else if (enquiry.event_id) {
        // Check if user manages this event
        const { data: event, error: eventError } = await adminSupabase
          .from('events')
          .select('user_id')
          .eq('id', enquiry.event_id)
          .single();

        if (eventError) {
          console.error('Error fetching event:', eventError);
        }

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

    // Transform enquiry to match expected inquiry format - same logic as list route
    let businessProfile = null;
    let eventManager = null;

    try {
      // Fetch business profile for contractor_id
      if (enquiry.contractor_id) {
        const { data: bp, error: bpError } = await adminSupabase
          .from('business_profiles')
          .select('id, user_id, company_name')
          .eq('id', enquiry.contractor_id)
          .maybeSingle();

        if (bpError) {
          console.error('Error fetching business profile:', bpError);
        } else {
          businessProfile = bp;
        }
      }
    } catch (err) {
      console.error('Exception fetching business profile:', err);
    }

    // Get sender from sender_id field (primary source - backfilled by migration)
    // This works for all enquiries, including contractor-to-contractor enquiries
    if (enquiry.sender_id) {
      try {
        // Try with profiles relationship first
        const { data: senderData, error: senderError } = await adminSupabase
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
          .maybeSingle();

        if (senderError) {
          console.error('Error fetching sender with profiles:', senderError);
          // Fallback: fetch user and profile separately
          const { data: userData } = await adminSupabase
            .from('users')
            .select('id, email')
            .eq('id', enquiry.sender_id)
            .maybeSingle();

          if (userData) {
            const { data: profileData } = await adminSupabase
              .from('profiles')
              .select('first_name, last_name, avatar_url')
              .eq('user_id', enquiry.sender_id)
              .maybeSingle();

            eventManager = {
              id: userData.id,
              email: userData.email,
              profiles:
                profileData && (profileData.first_name || profileData.last_name)
                  ? {
                      first_name: profileData.first_name || '',
                      last_name: profileData.last_name || '',
                      avatar_url: profileData.avatar_url || null,
                    }
                  : null,
            };
          }
        } else if (senderData) {
          const profile = Array.isArray(senderData.profiles)
            ? senderData.profiles[0]
            : senderData.profiles;

          eventManager = {
            id: senderData.id,
            email: senderData.email,
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
      } catch (err) {
        console.error('Exception fetching sender:', err);
      }
    }

    // Fallback: Try to get sender from enquiry_messages (for very old enquiries without sender_id)
    if (!eventManager) {
      const { data: firstMessage } = await adminSupabase
        .from('enquiry_messages')
        .select('sender_id')
        .eq('enquiry_id', enquiry.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstMessage?.sender_id) {
        const { data: senderData } = await adminSupabase
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
          .eq('id', firstMessage.sender_id)
          .maybeSingle();

        if (senderData) {
          const profile = Array.isArray(senderData.profiles)
            ? senderData.profiles[0]
            : senderData.profiles;

          eventManager = {
            id: senderData.id,
            email: senderData.email,
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
      }
    }

    // Last resort: Try to get sender from event.user_id (events table uses user_id, not event_manager_id)
    if (!eventManager && enquiry.event_id) {
      const { data: event } = await adminSupabase
        .from('events')
        .select('id, user_id, title, event_type, event_date')
        .eq('id', enquiry.event_id)
        .maybeSingle();

      if (event?.user_id) {
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
          .eq('id', event.user_id)
          .maybeSingle();

        if (eventManagerData) {
          const profile = Array.isArray(eventManagerData.profiles)
            ? eventManagerData.profiles[0]
            : eventManagerData.profiles;

          eventManager = {
            id: eventManagerData.id,
            email: eventManagerData.email,
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
      }
    }

    // If still no sender found, create a placeholder
    if (!eventManager) {
      eventManager = {
        id: enquiry.sender_id || 'unknown',
        email: 'Unknown Sender',
        profiles: null,
      };
    }

    // Get enquiry messages (responses) - simplified query
    let messages: any[] = [];
    try {
      const { data: messagesData, error: messagesError } = await adminSupabase
        .from('enquiry_messages')
        .select('*')
        .eq('enquiry_id', inquiryId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Messages fetch error:', messagesError);
        messages = [];
      } else {
        messages = messagesData || [];
      }
    } catch (err) {
      console.error('Exception fetching messages:', err);
      messages = [];
    }

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

    // Transform messages to match inquiry_responses format
    // Note: The original message is stored in both enquiries.message AND as the first message in enquiry_messages
    // We'll show all messages from enquiry_messages in chronological order
    const transformedResponses = await Promise.all(
      (messages || []).map(async (msg: any) => {
        let responder = null;

        if (msg.sender_id) {
          try {
            const { data: senderData, error: senderError } = await adminSupabase
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
              .eq('id', msg.sender_id)
              .maybeSingle();

            if (senderError) {
              // Fallback: fetch separately
              const { data: userData } = await adminSupabase
                .from('users')
                .select('id, email')
                .eq('id', msg.sender_id)
                .maybeSingle();

              if (userData) {
                const { data: profileData } = await adminSupabase
                  .from('profiles')
                  .select('first_name, last_name, avatar_url')
                  .eq('user_id', msg.sender_id)
                  .maybeSingle();

                responder = {
                  id: userData.id,
                  email: userData.email,
                  profiles:
                    profileData &&
                    (profileData.first_name || profileData.last_name)
                      ? {
                          first_name: profileData.first_name || '',
                          last_name: profileData.last_name || '',
                          avatar_url: profileData.avatar_url || null,
                        }
                      : null,
                };
              }
            } else if (senderData) {
              const profile = Array.isArray(senderData.profiles)
                ? senderData.profiles[0]
                : senderData.profiles;

              responder = {
                id: senderData.id,
                email: senderData.email,
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
          } catch (err) {
            console.error('Error fetching message responder:', err);
          }
        }

        return {
          id: msg.id,
          inquiry_id: msg.enquiry_id,
          responder_id: msg.sender_id,
          response_type: (msg.response_type || 'reply') as any, // Use saved response_type or default to 'reply'
          message: msg.message,
          is_template: false,
          created_at: msg.created_at,
          responder,
        };
      })
    );

    // Ensure all data is serializable - remove any circular references or non-serializable data
    const serializableInquiry = JSON.parse(JSON.stringify(transformedInquiry));
    const serializableResponses = JSON.parse(
      JSON.stringify(transformedResponses)
    );

    const response: InquiryDetailResponse = {
      inquiry: serializableInquiry as any,
      responses: serializableResponses as any,
      success: true,
    };

    try {
      return NextResponse.json(response);
    } catch (jsonError) {
      console.error('JSON serialization error:', jsonError);
      console.error('Trying to serialize inquiry:', {
        type: typeof transformedInquiry,
        keys: Object.keys(transformedInquiry),
      });
      throw jsonError;
    }
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
