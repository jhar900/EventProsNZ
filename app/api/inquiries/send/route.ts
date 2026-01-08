import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { checkSuspensionAndBlock } from '@/lib/middleware/suspension-middleware';
import { z } from 'zod';
import {
  SendInquiryRequest,
  BulkSendInquiryRequest,
  InquiryResponse,
  INQUIRY_TYPES,
  INQUIRY_PRIORITY,
} from '@/types/inquiries';

// Validation schemas
const sendInquirySchema = z.object({
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

const bulkSendInquirySchema = z.object({
  contractor_ids: z
    .array(z.string().uuid('Invalid contractor ID'))
    .min(1, 'At least one contractor required'),
  inquiry_data: z.object({
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
  }),
});

// POST /api/inquiries/send - Send a single inquiry
export async function POST(request: NextRequest) {
  try {
    console.log('=== Inquiry Send API Called ===');
    const { supabase } = createClient(request);

    // Try to get user from cookies/session first
    let user: any;
    let userProfile: any;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Debug logging
    console.log(
      'Session check - Session:',
      session?.user?.id,
      'Error:',
      sessionError?.message
    );

    if (session?.user) {
      user = session.user;
    } else {
      // Fallback to getUser if getSession doesn't work
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      console.log(
        'Fallback getUser - User:',
        getUserUser?.id,
        'Error:',
        authError?.message
      );

      if (getUserUser) {
        user = getUserUser;
      }
    }

    // If no user from cookies, try to get from x-user-id header (fallback)
    if (!user) {
      // Try both lowercase and original case header names
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      console.log('Checking x-user-id header:', userIdFromHeader);
      console.log(
        'All headers:',
        Object.fromEntries(request.headers.entries())
      );

      if (userIdFromHeader) {
        console.log('Using user ID from header:', userIdFromHeader);
        // Verify the user exists - use admin client to bypass RLS if needed
        const { createClient: createAdminClient } = await import(
          '@/lib/supabase/server'
        );
        const adminSupabase = createAdminClient();

        const { data: userData, error: userError } = await adminSupabase
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        console.log('User data from DB:', userData, 'Error:', userError);

        if (!userError && userData) {
          // Create a minimal user object with role
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
          // Set userProfile since we already have it from the lookup
          userProfile = userData;
          console.log(
            'User authenticated via header:',
            user.id,
            'Role:',
            userData.role
          );
        } else {
          console.log('Failed to verify user from header:', userError);
        }
      } else {
        console.log('No x-user-id header found');
      }
    }

    if (!user) {
      console.log('No user found - returning Unauthorized');
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized. Please ensure you are logged in.',
        },
        { status: 401 }
      );
    }

    // Check suspension status
    const serverSupabase = createServerClient();
    const suspensionResponse = await checkSuspensionAndBlock(
      request,
      user.id,
      serverSupabase
    );
    if (suspensionResponse) {
      return suspensionResponse;
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = sendInquirySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors:
            validationResult.error?.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const inquiryData = validationResult.data;
    console.log('Inquiry data validated:', {
      contractor_id: inquiryData.contractor_id,
      inquiry_type: inquiryData.inquiry_type,
      subject: inquiryData.subject?.substring(0, 50),
    });

    // Get user profile to verify they exist (any logged-in user can send inquiries)
    // If we got user from header, userProfile is already set above
    if (!userProfile) {
      // We have user from session/cookies, verify they exist
      // Use admin client to bypass RLS policies
      const { createClient: createAdminClient } = await import(
        '@/lib/supabase/server'
      );
      const adminSupabase = createAdminClient();

      const { data: profileData, error: profileError } = await adminSupabase
        .from('users')
        .select('id, role, email')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        console.log('User profile lookup failed:', profileError);
        return NextResponse.json(
          { success: false, message: 'User profile not found' },
          { status: 404 }
        );
      }
      userProfile = profileData;
    }

    // Verify contractor exists and get their business_profile ID
    // Use admin client to bypass RLS policies
    const { createClient: createAdminClient } = await import(
      '@/lib/supabase/server'
    );
    const adminSupabase = createAdminClient();

    // First, verify the user exists and is a contractor
    const { data: contractorUser, error: contractorUserError } =
      await adminSupabase
        .from('users')
        .select('id, role, is_verified')
        .eq('id', inquiryData.contractor_id)
        .eq('role', 'contractor')
        .single();

    console.log(
      'Contractor user lookup - ID:',
      inquiryData.contractor_id,
      'Data:',
      contractorUser,
      'Error:',
      contractorUserError
    );

    if (contractorUserError || !contractorUser) {
      console.log('Contractor user not found:', contractorUserError);
      return NextResponse.json(
        { success: false, message: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Get the business_profile ID for this contractor
    const { data: businessProfile, error: businessProfileError } =
      await adminSupabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', inquiryData.contractor_id)
        .single();

    console.log(
      'Business profile lookup - User ID:',
      inquiryData.contractor_id,
      'Business Profile ID:',
      businessProfile?.id,
      'Error:',
      businessProfileError
    );

    if (businessProfileError || !businessProfile) {
      console.log(
        'Business profile not found for contractor:',
        businessProfileError
      );
      return NextResponse.json(
        { success: false, message: 'Contractor business profile not found' },
        { status: 404 }
      );
    }

    // Verify event exists if provided
    // Events table uses user_id (not event_manager_id) to reference the event manager
    if (inquiryData.event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, user_id')
        .eq('id', inquiryData.event_id)
        .eq('user_id', user.id)
        .single();

      if (eventError || !event) {
        return NextResponse.json(
          { success: false, message: 'Event not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Create inquiry in the enquiries table
    // The enquiries table has a simpler schema: id, event_id, contractor_id (business_profiles.id), status, subject, message
    // Use admin client to bypass RLS policies since any logged-in user can send inquiries
    // Reuse the adminSupabase client that was already created for contractor lookup
    const inquiryPayload = {
      contractor_id: businessProfile.id, // References business_profiles.id, not users.id
      event_id: inquiryData.event_id || null,
      subject: inquiryData.subject,
      message: inquiryData.message,
      status: 'pending', // enquiries table uses 'pending' as default
      sender_id: user.id, // Track who sent the enquiry - important for contractor-to-contractor enquiries
    };

    console.log(
      'Attempting to create inquiry with payload:',
      JSON.stringify(inquiryPayload, null, 2)
    );

    const { data: inquiry, error: inquiryError } = await adminSupabase
      .from('enquiries')
      .insert(inquiryPayload)
      .select()
      .single();

    if (inquiryError) {
      console.error('Inquiry creation error:', inquiryError);
      console.error(
        'Full error details:',
        JSON.stringify(inquiryError, null, 2)
      );
      console.error('Inquiry data attempted:', {
        event_manager_id: user.id,
        contractor_id: inquiryData.contractor_id,
        event_id: inquiryData.event_id,
        inquiry_type: inquiryData.inquiry_type,
        subject: inquiryData.subject?.substring(0, 50),
        message_length: inquiryData.message?.length,
        event_details: inquiryData.event_details ? 'present' : 'null',
        priority: inquiryData.priority,
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create inquiry',
          error:
            inquiryError.message || inquiryError.details || 'Unknown error',
          error_code: inquiryError.code,
          error_hint: inquiryError.hint,
        },
        { status: 500 }
      );
    }

    console.log('Inquiry created successfully:', inquiry.id);

    // Create initial message in enquiry_messages table with sender_id
    // This ensures we can always identify who sent the enquiry (important for contractor-to-contractor enquiries)
    if (inquiry?.id) {
      const { error: messageError } = await adminSupabase
        .from('enquiry_messages')
        .insert({
          enquiry_id: inquiry.id,
          sender_id: user.id, // Store who sent it - critical for identifying sender
          message: inquiryData.message, // Initial message content
          is_read: false,
        });

      if (messageError) {
        console.error('Error creating initial enquiry message:', messageError);
        // Don't fail the whole request, but log the error
        // The enquiry was created successfully, just missing the message record
      } else {
        console.log('Initial enquiry message created with sender_id:', user.id);
      }
    }

    // Send email notification to contractor
    try {
      // Use the contractor user ID (not the business profile ID)
      const contractorUserId = contractorUser.id;

      // Fetch contractor and event manager details for email
      const { data: contractorData } = await adminSupabase
        .from('users')
        .select(
          `
          email,
          profiles(
            first_name,
            last_name
          )
        `
        )
        .eq('id', contractorUserId)
        .single();

      const { data: eventManagerData } = await adminSupabase
        .from('users')
        .select(
          `
          email,
          profiles(
            first_name,
            last_name
          )
        `
        )
        .eq('id', user.id)
        .single();

      if (contractorData?.email) {
        const contractorEmail = contractorData.email;
        const contractorProfile = Array.isArray(contractorData.profiles)
          ? contractorData.profiles[0]
          : contractorData.profiles;
        const contractorName = contractorProfile?.first_name || 'Contractor';

        const eventManagerProfile = Array.isArray(eventManagerData?.profiles)
          ? eventManagerData.profiles[0]
          : eventManagerData?.profiles;
        const eventManagerName =
          eventManagerProfile?.first_name || 'Event Manager';
        const eventManagerEmail = eventManagerData?.email || '';

        // Helper function to escape HTML
        const escapeHtml = (text: string): string => {
          const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
          };
          return text.replace(/[&<>"']/g, m => map[m]);
        };

        // Format date in NZ timezone
        const inquiryDate = inquiry.created_at || new Date().toISOString();
        const nzDate = new Date(inquiryDate).toLocaleString('en-NZ', {
          timeZone: 'Pacific/Auckland',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        // Prepare email content
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || 'https://eventprosnz.co.nz';
        const inquiriesUrl = `${baseUrl}/inquiries`;
        const emailSubject = `New Inquiry on Event Pros NZ: ${inquiryData.subject}`;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f18d30 0%, #f4a855 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #f18d30; }
              .value { margin-top: 5px; padding: 10px; background-color: white; border-radius: 4px; }
              .message { white-space: pre-wrap; }
              .button { display: inline-block; padding: 12px 24px; background-color: #f18d30; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
              .button:hover { background-color: #d97706; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Inquiry on Event Pros NZ</h2>
              </div>
              <div class="content">
                <p>Hello ${escapeHtml(contractorName)},</p>
                <p>You have received a new inquiry on Event Pros NZ from ${escapeHtml(eventManagerName)}.</p>
                
                <div class="field">
                  <div class="label">Subject:</div>
                  <div class="value">${escapeHtml(inquiryData.subject)}</div>
                </div>
                
                <div class="field">
                  <div class="label">Message:</div>
                  <div class="value message">${escapeHtml(inquiryData.message)}</div>
                </div>
                
                <div class="field">
                  <div class="label">Received At (NZ Time):</div>
                  <div class="value">${escapeHtml(nzDate)}</div>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${inquiriesUrl}" class="button">View Inquiry</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                  You can view and respond to this inquiry by clicking the button above or visiting your <a href="${inquiriesUrl}" style="color: #f18d30;">inquiries page</a>.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        const emailText = `
New Inquiry on Event Pros NZ

Hello ${contractorName},

You have received a new inquiry on Event Pros NZ from ${eventManagerName}.

Subject: ${inquiryData.subject}

Message:
${inquiryData.message}

Received At (NZ Time): ${nzDate}

View this inquiry: ${inquiriesUrl}
        `.trim();

        // Send email using SimpleEmailService
        const { SimpleEmailService } = await import(
          '@/lib/email/simple-email-service'
        );

        const result = await SimpleEmailService.sendEmail({
          to: contractorEmail,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
          from: 'no-reply@eventpros.co.nz',
          fromName: 'Event Pros NZ',
        });

        if (result.success) {
          console.log(
            `Inquiry notification email sent to contractor: ${contractorEmail}`,
            { messageId: result.messageId, inquiryId: inquiry.id }
          );
        } else {
          console.error(
            'Failed to send inquiry notification email:',
            result.error
          );
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the inquiry creation
      console.error('Error sending inquiry notification email:', emailError);
      // Continue execution - inquiry was already created successfully
    }

    const response: InquiryResponse = {
      inquiry,
      success: true,
      message: 'Inquiry sent successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Inquiry send error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/inquiries/bulk-send - Send inquiries to multiple contractors
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
    const validationResult = bulkSendInquirySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors:
            validationResult.error?.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const { contractor_ids, inquiry_data } = validationResult.data;

    // Check if user is an event manager
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'event_manager') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only event managers can send bulk inquiries',
        },
        { status: 403 }
      );
    }

    // Verify all contractors exist and are verified
    const { data: contractors, error: contractorsError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .in('id', contractor_ids)
      .eq('role', 'contractor');

    if (
      contractorsError ||
      !contractors ||
      contractors.length !== contractor_ids.length
    ) {
      return NextResponse.json(
        { success: false, message: 'One or more contractors not found' },
        { status: 404 }
      );
    }

    const unverifiedContractors = contractors.filter(c => !c.is_verified);
    if (unverifiedContractors.length > 0) {
      return NextResponse.json(
        { success: false, message: 'One or more contractors are not verified' },
        { status: 400 }
      );
    }

    // Verify event exists if provided
    if (inquiry_data.event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, event_manager_id')
        .eq('id', inquiry_data.event_id)
        .eq('event_manager_id', user.id)
        .single();

      if (eventError || !event) {
        return NextResponse.json(
          { success: false, message: 'Event not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Create inquiries for all contractors
    const inquiriesToCreate = contractor_ids.map(contractor_id => ({
      event_manager_id: user.id,
      contractor_id,
      event_id: inquiry_data.event_id,
      inquiry_type: inquiry_data.inquiry_type,
      subject: inquiry_data.subject,
      message: inquiry_data.message,
      event_details: inquiry_data.event_details,
      priority: inquiry_data.priority,
      status: 'sent',
    }));

    const { data: inquiries, error: inquiriesError } = await supabase
      .from('inquiries')
      .insert(inquiriesToCreate)
      .select();

    if (inquiriesError) {
      console.error('Bulk inquiry creation error:', inquiriesError);
      return NextResponse.json(
        { success: false, message: 'Failed to create inquiries' },
        { status: 500 }
      );
    }

    // TODO: Send email notifications to all contractors
    // This would integrate with the notification system

    return NextResponse.json({
      inquiries: inquiries || [],
      success: true,
      message: `Inquiries sent to ${contractor_ids.length} contractors`,
    });
  } catch (error) {
    console.error('Bulk inquiry send error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
