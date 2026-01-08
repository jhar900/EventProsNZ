import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const contractorId = params.id;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Get the current user (must be authenticated)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify contractor exists and is verified
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', contractorId)
      .eq('role', 'contractor')
      .eq('is_verified', true)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Prevent contractors from contacting themselves
    if (user.id === contractorId) {
      return NextResponse.json(
        { error: 'Cannot contact yourself' },
        { status: 400 }
      );
    }

    // Get user profile to verify they're an event manager
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'event_manager') {
      return NextResponse.json(
        { error: 'Only event managers can send inquiries' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subject, message } = body;

    // Validate input
    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { error: 'Subject must be 200 characters or less' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Check for recent inquiries to prevent spam
    const { data: recentInquiries } = await supabase
      .from('inquiries')
      .select('id')
      .eq('event_manager_id', user.id)
      .eq('contractor_id', contractorId)
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      )
      .limit(1);

    if (recentInquiries && recentInquiries.length > 0) {
      return NextResponse.json(
        {
          error: 'You can only send one inquiry per day to the same contractor',
        },
        { status: 429 }
      );
    }

    // Create the inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        contractor_id: contractorId,
        event_manager_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (inquiryError) {
      return NextResponse.json(
        { error: 'Failed to send inquiry' },
        { status: 500 }
      );
    }

    // Send email notification to contractor
    try {
      // Fetch contractor and event manager details for email
      const { data: contractorData } = await supabase
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
        .eq('id', contractorId)
        .single();

      const { data: eventManagerData } = await supabase
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
        const nzDate = new Date(inquiry.created_at).toLocaleString('en-NZ', {
          timeZone: 'Pacific/Auckland',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        // Prepare email content
        const emailSubject = `New Inquiry on Event Pros NZ: ${inquiry.subject}`;
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || 'https://eventprosnz.co.nz';
        const inquiriesUrl = `${baseUrl}/inquiries`;

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
                  <div class="value">${escapeHtml(inquiry.subject)}</div>
                </div>
                
                <div class="field">
                  <div class="label">Message:</div>
                  <div class="value message">${escapeHtml(inquiry.message)}</div>
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

Subject: ${inquiry.subject}

Message:
${inquiry.message}

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
            'Contractor inquiry notification email sent successfully',
            {
              messageId: result.messageId,
              contractorId,
              inquiryId: inquiry.id,
            }
          );
        } else {
          console.error(
            'Failed to send contractor inquiry notification email:',
            result.error
          );
        }
      }
    } catch (emailError: any) {
      // Log error but don't fail the request
      console.error(
        'Failed to send contractor inquiry notification email:',
        emailError?.message || emailError
      );
    }

    return NextResponse.json({
      inquiry,
      message: 'Inquiry sent successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
