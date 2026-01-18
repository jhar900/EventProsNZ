import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';
import { SimpleEmailService } from '@/lib/email/simple-email-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    let user = session?.user;

    // Fallback: Try to get user ID from header if session fails
    if (!user) {
      const {
        data: { user: getUserUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !getUserUser) {
        // Try header fallback
        const userIdFromHeader = request.headers.get('x-user-id');
        if (userIdFromHeader) {
          const { createClient: createServerClient } = await import(
            '@/lib/supabase/server'
          );
          const adminSupabase = createServerClient();
          const { data: userData } = await adminSupabase
            .from('users')
            .select('id, email, role')
            .eq('id', userIdFromHeader)
            .single();

          if (userData) {
            user = {
              id: userData.id,
              email: userData.email || '',
              role: userData.role,
            } as any;
          }
        }

        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized. Please log in first.' },
            { status: 401 }
          );
        }
      } else {
        user = getUserUser;
      }
    }

    // Verify user is an event manager
    // Use admin client for database operations
    const adminSupabase = createServerClient();
    let userRole: string | undefined = (user as any).role;

    if (!userRole) {
      const { data: userData } = await adminSupabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      userRole = userData?.role;
    }

    if (userRole !== 'event_manager') {
      return NextResponse.json(
        {
          error: 'Only event managers can reinvite team members',
          userRole: userRole,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    // Find the invitation (can be from team_member_invitations or team_members)
    // First, check team_member_invitations
    const { data: invitation, error: invitationError } = await adminSupabase
      .from('team_member_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('event_manager_id', user.id)
      .maybeSingle();

    if (invitationError && invitationError.code !== 'PGRST116') {
      console.error('[Reinvite] Error fetching invitation:', invitationError);
      return NextResponse.json(
        {
          error: 'Failed to find invitation',
          details: invitationError.message,
        },
        { status: 500 }
      );
    }

    // If invitation found, check if user has already accepted
    if (invitation) {
      const { data: existingUser } = await adminSupabase
        .from('users')
        .select('id')
        .eq('email', invitation.email)
        .maybeSingle();

      if (existingUser) {
        const { data: existingTeamMember } = await adminSupabase
          .from('team_members')
          .select('id, accepted_at')
          .eq('event_manager_id', user.id)
          .eq('team_member_id', existingUser.id)
          .not('accepted_at', 'is', null)
          .maybeSingle();

        if (existingTeamMember) {
          return NextResponse.json(
            {
              error: 'This team member has already accepted the invitation',
              details:
                'You cannot reinvite a team member who has already accepted.',
              alreadyAccepted: true,
            },
            { status: 400 }
          );
        }
      }
    }

    // If not found in invitations, check if it's a team_member record
    let teamMember = null;
    if (!invitation) {
      const { data: member, error: memberError } = await adminSupabase
        .from('team_members')
        .select('id, team_member_id, role, accepted_at, status')
        .eq('id', invitationId)
        .eq('event_manager_id', user.id)
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('[Reinvite] Error fetching team member:', memberError);
        return NextResponse.json(
          {
            error: 'Failed to find team member',
            details: memberError.message,
          },
          { status: 500 }
        );
      }

      teamMember = member;
    }

    // If neither found, return error
    if (!invitation && !teamMember) {
      return NextResponse.json(
        {
          error: 'Invitation or team member not found',
          details:
            'The specified invitation does not exist or does not belong to you',
        },
        { status: 404 }
      );
    }

    // Determine email and name from invitation or team member
    let inviteEmail: string;
    let firstName: string;
    let lastName: string;
    let role: string;

    if (invitation) {
      inviteEmail = invitation.email;
      firstName = invitation.first_name;
      lastName = invitation.last_name;
      role = invitation.role;
    } else if (teamMember) {
      // Check if team member has already accepted (has accepted_at)
      if (teamMember.accepted_at) {
        return NextResponse.json(
          {
            error: 'This team member has already accepted the invitation',
            details:
              'You cannot reinvite a team member who has already accepted.',
            alreadyAccepted: true,
          },
          { status: 400 }
        );
      }

      // Get user email and profile for team member
      const { data: teamMemberUser } = await adminSupabase
        .from('users')
        .select('email')
        .eq('id', teamMember.team_member_id)
        .single();

      if (!teamMemberUser) {
        return NextResponse.json(
          { error: 'Team member user not found' },
          { status: 404 }
        );
      }

      inviteEmail = teamMemberUser.email;

      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', teamMember.team_member_id)
        .maybeSingle();

      firstName = profile?.first_name || 'User';
      lastName = profile?.last_name || '';
      role = teamMember.role;
    } else {
      return NextResponse.json(
        { error: 'Unable to determine invitation details' },
        { status: 500 }
      );
    }

    // Generate new invite token and expiration
    const newInviteToken = `tm_${randomBytes(32).toString('hex')}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    // Update invitation if it exists, otherwise create a new one
    if (invitation) {
      const { error: updateError } = await adminSupabase
        .from('team_member_invitations')
        .update({
          status: 'invited',
          invite_token: newInviteToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('[Reinvite] Error updating invitation:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update invitation',
            details: updateError.message,
          },
          { status: 500 }
        );
      }
    } else if (teamMember) {
      // If no invitation exists but team member does, create a new invitation
      const { error: createError } = await adminSupabase
        .from('team_member_invitations')
        .insert({
          event_manager_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: inviteEmail,
          role: role,
          invite_token: newInviteToken,
          status: 'invited',
          expires_at: expiresAt.toISOString(),
        });

      if (createError) {
        console.error('[Reinvite] Error creating invitation:', createError);
        // Don't fail if invitation creation fails, we can still update team member status
      }
    }

    // Update team member status if it exists
    if (teamMember) {
      const { error: updateError } = await adminSupabase
        .from('team_members')
        .update({
          status: 'invited',
          updated_at: new Date().toISOString(),
        })
        .eq('id', teamMember.id);

      if (updateError) {
        console.error('[Reinvite] Error updating team member:', updateError);
        // Don't fail if team member update fails, invitation was already updated
      }
    }

    // Generate invite link
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';
    const inviteLink = `${baseUrl}/team/invite/${newInviteToken}`;

    // Get event manager's name for email
    const { data: profileData } = await adminSupabase
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
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    const isTestEmail =
      resendFromEmail === 'onboarding@resend.dev' ||
      resendFromEmail?.includes('@resend.dev');

    const fromEmail = isTestEmail
      ? 'no-reply@eventpros.co.nz'
      : resendFromEmail || 'no-reply@eventpros.co.nz';

    const emailResponse = await SimpleEmailService.sendEmail({
      to: inviteEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      from: fromEmail,
      fromName: 'Event Pros NZ',
    });

    if (!emailResponse.success) {
      console.error(
        '[Reinvite] Failed to send invitation email:',
        emailResponse.error
      );
      return NextResponse.json(
        {
          error: 'Failed to send invitation email',
          details: emailResponse.error || 'Email service error',
        },
        { status: 500 }
      );
    }

    console.log('[Reinvite] Invitation resent successfully:', {
      invitationId,
      email: inviteEmail,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
    });
  } catch (error) {
    console.error('[Reinvite] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reinvite team member',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
