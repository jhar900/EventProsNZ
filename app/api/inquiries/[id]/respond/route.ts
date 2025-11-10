import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { RESPONSE_TYPES } from '@/types/inquiries';

// Validation schema
const createResponseSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message too long'),
  response_type: z
    .enum(Object.values(RESPONSE_TYPES) as [string, ...string[]])
    .default('reply'),
});

// POST /api/inquiries/[id]/respond - Create a response to an inquiry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    console.log('POST /api/inquiries/[id]/respond called');
    const { supabase } = createClient(request);
    const resolvedParams = params instanceof Promise ? await params : params;
    const inquiryId = resolvedParams.id;

    console.log('Inquiry ID:', inquiryId);

    // Parse request body FIRST so we can use user_id from body as fallback
    let body: any;
    try {
      const bodyText = await request.text();
      body = JSON.parse(bodyText);
    } catch (err) {
      console.error('Error parsing request body:', err);
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Get current user - try session first, then fallback to getUser, then header, then body
    let user: any;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      sessionError: sessionError?.message,
    });

    if (session?.user) {
      user = session.user;
      console.log('User from session:', user.id);
    } else {
      // Fallback to getUser
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      console.log('getUser check:', {
        hasUser: !!getUserUser,
        userId: getUserUser?.id,
        authError: authError?.message,
      });

      if (getUserUser) {
        user = getUserUser;
        console.log('User from getUser:', user.id);
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

      console.log('Header check:', {
        hasHeader: !!userIdFromHeader,
        rawHeaderValue: userIdFromHeaderRaw,
        extractedUserId: userIdFromHeader,
        allHeaders: Object.fromEntries(request.headers.entries()),
      });

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

          console.log('Header user lookup:', {
            hasUserData: !!userData,
            userId: userData?.id,
            userEmail: userData?.email,
            userRole: userData?.role,
            userError: userError?.message,
            userErrorCode: userError?.code,
          });

          if (!userError && userData) {
            // Create a minimal user object
            user = {
              id: userData.id,
              email: userData.email || '',
              role: userData.role,
            } as any;
            console.log('User from header:', user.id, user.role);
          } else {
            console.error('Failed to fetch user from header:', userError);
          }
        } catch (err) {
          console.error('Error in header-based auth:', err);
        }
      }
    }

    // Final fallback: try to get user_id from request body
    if (!user && body.user_id) {
      console.log('Trying to get user from request body:', body.user_id);
      try {
        const adminSupabaseForAuth = createServerClient();
        const { data: userData, error: userError } = await adminSupabaseForAuth
          .from('users')
          .select('id, email, role')
          .eq('id', body.user_id)
          .single();

        console.log('Body user lookup:', {
          hasUserData: !!userData,
          userId: userData?.id,
          userEmail: userData?.email,
          userRole: userData?.role,
          userError: userError?.message,
          userErrorCode: userError?.code,
        });

        if (!userError && userData) {
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
          console.log('User from request body:', user.id, user.role);
        } else {
          console.error('Failed to fetch user from body:', userError);
        }
      } catch (err) {
        console.error('Error in body-based auth:', err);
      }
    }

    // If still no user, this is a critical authentication failure
    // But we can't proceed without knowing which user is responding

    if (!user) {
      console.error('No user found - returning 401');
      console.error('All authentication methods failed:', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        hasHeader: !!request.headers.get('x-user-id'),
        headerValue: request.headers.get('x-user-id'),
        hasBodyUserId: !!body.user_id,
        bodyUserId: body.user_id,
        allHeaders: Object.fromEntries(request.headers.entries()),
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          details: 'Authentication failed. Please ensure you are logged in.',
          debug: {
            hasSession: !!session,
            hasHeader: !!request.headers.get('x-user-id'),
            hasBodyUserId: !!body.user_id,
          },
        },
        { status: 401 }
      );
    }

    console.log('Authenticated user:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove user_id from body before validation (it's not part of the schema)
    const { user_id, ...bodyForValidation } = body;
    const validationResult = createResponseSchema.safeParse(bodyForValidation);

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

    const { message, response_type } = validationResult.data;

    // Use admin client to bypass RLS
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

    // Get current enquiry
    const { data: enquiry, error: enquiryError } = await adminSupabase
      .from('enquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();

    if (enquiryError || !enquiry) {
      return NextResponse.json(
        { success: false, message: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to respond
    let canRespond = false;

    console.log('Checking respond permissions:', {
      userId: user.id,
      userRole: userProfile.role,
      enquiryId: enquiry.id,
      enquiryContractorId: enquiry.contractor_id,
      enquirySenderId: enquiry.sender_id,
      enquiryEventId: enquiry.event_id,
    });

    if (userProfile.role === 'admin') {
      canRespond = true;
      console.log('Admin user, allowing response');
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

      console.log('Contractor permission check:', {
        businessProfileId: businessProfile?.id,
        enquiryContractorId: enquiry.contractor_id,
        match: businessProfile?.id === enquiry.contractor_id,
      });

      if (businessProfile && enquiry.contractor_id === businessProfile.id) {
        canRespond = true;
      }
    } else if (userProfile.role === 'event_manager') {
      // Event managers can respond if they sent the enquiry OR manage the event
      if (enquiry.sender_id === user.id) {
        canRespond = true;
        console.log('Event manager sent the enquiry, allowing response');
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

        console.log('Event manager permission check:', {
          eventUserId: event?.user_id,
          userId: user.id,
          match: event?.user_id === user.id,
        });

        if (event && event.user_id === user.id) {
          canRespond = true;
        }
      }
    }

    console.log('Final permission result:', { canRespond });

    if (!canRespond) {
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

    // Create response in enquiry_messages table
    // Table structure: id, enquiry_id, sender_id, message, is_read, created_at
    console.log('Inserting message into enquiry_messages:', {
      enquiry_id: inquiryId,
      sender_id: user.id,
      message_length: message.length,
      message_preview: message.substring(0, 50),
    });

    // Build insert payload - only include response_type if column exists
    const insertPayload: any = {
      enquiry_id: inquiryId,
      sender_id: user.id,
      message: message,
    };

    // Try to include response_type (will fail gracefully if column doesn't exist yet)
    // The migration should be run first, but this allows backward compatibility
    try {
      insertPayload.response_type = response_type;
    } catch (err) {
      console.warn('Could not set response_type:', err);
    }

    const { data: messageData, error: messageError } = await adminSupabase
      .from('enquiry_messages')
      .insert(insertPayload)
      .select()
      .single();

    if (messageError) {
      console.error('Message creation error:', {
        error: messageError,
        code: messageError.code,
        message: messageError.message,
        details: messageError.details,
        hint: messageError.hint,
        fullError: JSON.stringify(messageError, null, 2),
      });

      // If error is about unknown column, try without response_type
      if (
        messageError.message?.includes('column') &&
        messageError.message?.includes('response_type')
      ) {
        console.log(
          'Retrying insert without response_type column (migration may not be applied)'
        );
        const { data: retryData, error: retryError } = await adminSupabase
          .from('enquiry_messages')
          .insert({
            enquiry_id: inquiryId,
            sender_id: user.id,
            message: message,
          })
          .select()
          .single();

        if (retryError) {
          return NextResponse.json(
            {
              success: false,
              message: 'Failed to create response',
              error: retryError.message,
              code: retryError.code,
              details: retryError.details,
            },
            { status: 500 }
          );
        }

        // Success without response_type - return success
        return NextResponse.json({
          success: true,
          response: retryData,
          message:
            'Response created (response_type column not available - please run migration)',
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create response',
          error: messageError.message,
          code: messageError.code,
          details: messageError.details,
        },
        { status: 500 }
      );
    }

    console.log('Message created successfully:', {
      messageId: messageData?.id,
      enquiryId: messageData?.enquiry_id,
      senderId: messageData?.sender_id,
    });

    // Update enquiry status to 'responded' if not already
    if (enquiry.status !== 'responded') {
      await adminSupabase
        .from('enquiries')
        .update({ status: 'responded' })
        .eq('id', inquiryId);
    }

    // Fetch user profile for the response
    let responderProfile = null;
    if (messageData?.sender_id) {
      try {
        const { data: profileData } = await adminSupabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('user_id', messageData.sender_id)
          .maybeSingle();

        if (profileData) {
          responderProfile = {
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            avatar_url: profileData.avatar_url || null,
          };
        }
      } catch (profileError) {
        console.error('Error fetching responder profile:', profileError);
      }
    }

    // Return response with profile data attached
    const responseWithProfile = {
      ...messageData,
      responder: {
        id: user.id,
        email: user.email || '',
        profiles: responderProfile,
      },
    };

    return NextResponse.json({
      success: true,
      response: responseWithProfile,
      message: 'Response created successfully',
    });
  } catch (error) {
    console.error('Response creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
