import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Find the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('team_member_invitations')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'invited')
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        {
          error: 'Invalid or expired invitation',
          details: invitationError?.message || 'Invitation not found',
        },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Get event manager's profile information
    const { data: managerProfile, error: managerProfileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', invitation.event_manager_id)
      .single();

    const managerName = managerProfile
      ? `${managerProfile.first_name} ${managerProfile.last_name}`.trim()
      : null;

    // Check if user exists by email
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', invitation.email)
      .single();

    const userExists = !!existingUser && !userError;
    let isOnboarded = false;

    if (userExists && existingUser) {
      // Check if user has profile with name and avatar
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('user_id', existingUser.id)
        .single();

      if (!profileError && profile) {
        // User is onboarded if they have both name and avatar
        isOnboarded = !!(
          profile.first_name &&
          profile.last_name &&
          profile.avatar_url
        );
      }
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        role: invitation.role,
        eventManagerId: invitation.event_manager_id,
        eventManagerName: managerName,
      },
      userExists,
      isOnboarded,
      userId: existingUser?.id || null,
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
