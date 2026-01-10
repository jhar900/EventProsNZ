import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { SimpleEmailService } from '@/lib/email/simple-email-service';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Log request details
    console.log('[Team Invite API] Request received');
    console.log('[Team Invite API] Request URL:', request.url);
    console.log('[Team Invite API] Request method:', request.method);

    // Log cookies
    const cookies = request.cookies.getAll();
    console.log('[Team Invite API] Cookies received:', {
      count: cookies.length,
      cookieNames: cookies.map(c => c.name),
      hasAuthCookie: cookies.some(
        c => c.name.includes('auth') || c.name.includes('supabase')
      ),
    });

    const { supabase } = createClient(request);

    // Get current user - use getSession() first to avoid refresh token errors
    console.log('[Team Invite API] Attempting getSession()...');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('[Team Invite API] getSession() result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionError: sessionError
        ? {
            message: sessionError.message,
            status: sessionError.status,
            name: sessionError.name,
          }
        : null,
    });

    let user = session?.user;

    // If no session, try getUser (but handle refresh token errors)
    if (!user) {
      console.log(
        '[Team Invite API] No session found, attempting getUser()...'
      );
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      console.log('[Team Invite API] getUser() result:', {
        hasUser: !!getUserUser,
        userId: getUserUser?.id,
        userEmail: getUserUser?.email,
        authError: authError
          ? {
              message: authError.message,
              status: authError.status,
              name: authError.name,
            }
          : null,
      });

      // Handle refresh token errors gracefully
      if (authError) {
        console.error('[Team Invite API] Authentication error:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
        });

        // Only return early for refresh token errors - other errors will fall through to header check
        if (
          authError.message?.includes('refresh_token_not_found') ||
          authError.message?.includes('Invalid Refresh Token') ||
          authError.message?.includes('Refresh Token Not Found')
        ) {
          return NextResponse.json(
            {
              error: 'Session expired. Please log in again.',
              code: 'SESSION_EXPIRED',
            },
            { status: 401 }
          );
        }
        // Don't return here - continue to header fallback check
        console.log(
          '[Team Invite API] Auth error but continuing to header fallback...'
        );
      } else {
        user = getUserUser;
      }
    }

    // Fallback: Try to get user ID from header if cookies aren't working
    if (!user) {
      console.log('[Team Invite API] Trying fallback: x-user-id header...');
      const userIdFromHeader =
        request.headers.get('x-user-id') ||
        request.headers.get('X-User-Id') ||
        request.headers.get('X-USER-ID');

      console.log('[Team Invite API] Header check:', {
        hasHeader: !!userIdFromHeader,
        headerValue: userIdFromHeader,
      });

      if (userIdFromHeader) {
        // Verify the user exists - use admin client to bypass RLS
        const { createClient: createServerClient } = await import(
          '@/lib/supabase/server'
        );
        const adminSupabase = createServerClient();
        const { data: userData, error: userError } = await adminSupabase
          .from('users')
          .select('id, email, role')
          .eq('id', userIdFromHeader)
          .single();

        console.log('[Team Invite API] Header user lookup:', {
          hasUserData: !!userData,
          userId: userData?.id,
          userEmail: userData?.email,
          userRole: userData?.role,
          userError: userError?.message,
        });

        if (!userError && userData) {
          // Create a minimal user object
          user = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
          } as any;
          console.log(
            '[Team Invite API] User authenticated from header:',
            user.id
          );
        } else {
          console.error(
            '[Team Invite API] Failed to verify user from header:',
            userError
          );
        }
      }
    }

    if (!user) {
      console.error(
        '[Team Invite API] No user found after all authentication attempts'
      );
      console.error('[Team Invite API] Session check:', {
        hasSession: !!session,
        sessionError,
      });
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'No user found after authentication attempts',
          code: 'NO_USER',
        },
        { status: 401 }
      );
    }

    console.log('[Team Invite API] User authenticated:', {
      userId: user.id,
      userEmail: user.email,
      hasRole: !!(user as any).role,
    });

    // Verify user is an event manager
    // If we already have the role from header auth, use it; otherwise query
    let userRole: string | undefined = (user as any).role;

    if (!userRole) {
      console.log('[Team Invite API] Role not in user object, querying...');
      // Use admin client to bypass RLS if needed
      const { createClient: createServerClient } = await import(
        '@/lib/supabase/server'
      );
      const adminSupabase = createServerClient();

      const { data: userData, error: userDataError } = await adminSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('[Team Invite API] User role check:', {
        userData,
        userDataError: userDataError
          ? {
              message: userDataError.message,
              code: userDataError.code,
            }
          : null,
      });

      if (userDataError) {
        console.error(
          '[Team Invite API] Error fetching user data:',
          userDataError
        );
        return NextResponse.json(
          {
            error: 'Failed to verify user role',
            details: userDataError.message,
          },
          { status: 500 }
        );
      }

      userRole = userData?.role;
    } else {
      console.log(
        '[Team Invite API] Using role from authenticated user:',
        userRole
      );
    }

    if (userRole !== 'event_manager') {
      console.warn('[Team Invite API] User is not an event manager:', {
        userId: user.id,
        userRole: userRole,
      });
      return NextResponse.json(
        {
          error: 'Only event managers can invite team members',
          userRole: userRole,
        },
        { status: 403 }
      );
    }

    console.log('[Team Invite API] User is an event manager, proceeding...');

    const body = await request.json();
    const { firstName, lastName, role, email } = body;

    // Validate required fields
    if (!firstName || !lastName || !role || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, role, email' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Generate unique invite token
    const inviteToken = `tm_${randomBytes(32).toString('hex')}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    // Store invitation in database
    const { data: invitationData, error: insertError } = await supabase
      .from('team_member_invitations')
      .insert({
        event_manager_id: user.id,
        first_name: firstName,
        last_name: lastName,
        role: role,
        email: email,
        invite_token: inviteToken,
        status: 'invited',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing invitation:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to store invitation',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // Generate invite link
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';
    const inviteLink = `${baseUrl}/team/invite/${inviteToken}`;

    // Get event manager's name for email
    const { data: profileData } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();

    const managerName = profileData
      ? `${profileData.first_name} ${profileData.last_name}`
      : 'Event Manager';

    // Send invitation email
    const emailSubject = `You've been invited to join ${managerName}'s team on Event Pros NZ`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Event Pros NZ</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Team Invitation</h2>
            <p>Hi ${firstName},</p>
            <p>${managerName} has invited you to join their event management team on Event Pros NZ as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation and join the team:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${inviteLink}</p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This invitation will expire in 7 days.</p>
            <p style="font-size: 14px; color: #6b7280;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Event Pros NZ. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
    const emailText = `
Event Pros NZ - Team Invitation

Hi ${firstName},

${managerName} has invited you to join their event management team on Event Pros NZ as a ${role}.

Accept the invitation by visiting this link:
${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Event Pros NZ. All rights reserved.
    `;

    // Use verified domain email for Resend
    // If RESEND_FROM_EMAIL is set to the test email (onboarding@resend.dev), use our verified domain instead
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    const isTestEmail =
      resendFromEmail === 'onboarding@resend.dev' ||
      resendFromEmail?.includes('@resend.dev');

    const fromEmail = isTestEmail
      ? 'no-reply@eventpros.co.nz' // Use verified domain instead of test email
      : resendFromEmail || 'no-reply@eventpros.co.nz';

    console.log('[Team Invite API] Sending email:', {
      to: email,
      from: fromEmail,
      wasTestEmail: isTestEmail,
      originalResendFromEmail: resendFromEmail,
    });

    const emailResponse = await SimpleEmailService.sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      from: fromEmail,
      fromName: 'Event Pros NZ',
    });

    if (!emailResponse.success) {
      console.error(
        '[Team Invite API] Failed to send invitation email:',
        emailResponse.error
      );

      // Check if it's a domain verification error
      const errorMessage =
        emailResponse.error?.message ||
        String(emailResponse.error || 'Unknown error');
      const isDomainError =
        errorMessage.includes('verify a domain') ||
        errorMessage.includes('validation_error');

      if (isDomainError) {
        console.error(
          '[Team Invite API] Domain verification issue. Please verify the domain in Resend dashboard.'
        );
        return NextResponse.json(
          {
            error: 'Email service configuration error',
            details:
              'The email domain needs to be verified in Resend. Please contact support or verify the domain at resend.com/domains',
            code: 'DOMAIN_NOT_VERIFIED',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to send invitation email',
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('[Team Invite API] Unexpected error:', {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        error: 'Failed to send invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNEXPECTED_ERROR',
      },
      { status: 500 }
    );
  }
}
