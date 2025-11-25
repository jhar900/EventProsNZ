import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = authResult.supabase || supabaseAdmin;

    const userId = params.userId;

    // Fetch all data in parallel for better performance
    const [
      userResult,
      profileResult,
      businessProfileResult,
      verificationLogResult,
      onboardingStatusResult,
    ] = await Promise.all([
      // Get user details
      supabaseAdmin
        .from('users')
        .select(
          'id, email, role, is_verified, created_at, updated_at, last_login'
        )
        .eq('id', userId)
        .single(),
      // Get profile separately
      supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      // Get business profile separately
      supabaseAdmin
        .from('business_profiles')
        .select(
          'company_name, business_address, nzbn, description, service_areas, social_links, is_verified, verification_date, logo_url'
        )
        .eq('user_id', userId)
        .maybeSingle(),
      // Get verification log (limited to 50 most recent for performance)
      supabaseAdmin
        .from('verification_logs')
        .select('id, action, status, reason, created_at, admin_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      // Get onboarding status for contractors
      supabaseAdmin
        .from('contractor_onboarding_status')
        .select('is_submitted')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const { data: userData, error: userError } = userResult;
    const { data: profileData, error: profileError } = profileResult;
    const { data: businessProfileData, error: businessProfileError } =
      businessProfileResult;
    const { data: verificationLog, error: logError } = verificationLogResult;
    const { data: onboardingStatus } = onboardingStatusResult;

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    if (businessProfileError) {
      console.error('Error fetching business profile:', businessProfileError);
    }

    if (logError) {
      console.error('Error fetching verification logs:', logError);
    }

    // Combine all data - map profile_photo_url to avatar_url if needed
    // Ensure we always return profile structure even if data is missing
    const transformedUserData = {
      ...userData,
      profiles: profileData
        ? {
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            phone: profileData.phone || null,
            address: profileData.address || null,
            bio: profileData.bio || null,
            profile_photo_url:
              profileData.avatar_url || profileData.profile_photo_url || null,
          }
        : null,
      business_profiles: businessProfileData,
    };

    // If we have logs and need admin names, fetch them separately (only for non-null admin_ids)
    // This is done after the main query to avoid slow joins
    let logsWithProfiles = verificationLog || [];
    if (logsWithProfiles.length > 0) {
      const adminIds = [
        ...new Set(
          logsWithProfiles
            .map((log: any) => log.admin_id)
            .filter((id: string | null) => id !== null)
        ),
      ] as string[];

      if (adminIds.length > 0) {
        const { data: adminProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', adminIds);

        // Map admin profiles to logs
        if (adminProfiles) {
          const profileMap = new Map(adminProfiles.map((p: any) => [p.id, p]));
          logsWithProfiles = logsWithProfiles.map((log: any) => ({
            ...log,
            profiles: log.admin_id ? profileMap.get(log.admin_id) : null,
          }));
        }
      }
    }

    // Determine verification status based on logs and onboarding
    // Priority: is_verified > onboarding status > most recent log action > check for rejection history
    let verification_status:
      | 'pending'
      | 'approved'
      | 'rejected'
      | 'onboarding' = 'pending';

    // Check if user is a contractor who hasn't completed onboarding
    if (
      userData.role === 'contractor' &&
      onboardingStatus &&
      !onboardingStatus.is_submitted
    ) {
      verification_status = 'onboarding';
    } else if (userData.is_verified) {
      verification_status = 'approved';
    } else if (verificationLog && verificationLog.length > 0) {
      // Find the most recent rejection and approval to determine current status
      const mostRecentRejection = verificationLog.find(
        (log: any) => log.action === 'reject' || log.status === 'rejected'
      );
      const mostRecentApproval = verificationLog.find(
        (log: any) => log.action === 'approve' || log.status === 'approved'
      );

      // If there's an approval after the most recent rejection, status is approved
      // If there's a rejection and no approval after it, status is rejected
      // Otherwise, status is pending
      if (mostRecentApproval) {
        // Check if approval came after rejection
        if (
          !mostRecentRejection ||
          new Date(mostRecentApproval.created_at) >
            new Date(mostRecentRejection.created_at)
        ) {
          verification_status = 'approved';
        } else {
          verification_status = 'rejected';
        }
      } else if (mostRecentRejection) {
        verification_status = 'rejected';
      } else {
        verification_status = 'pending';
      }
    }

    return NextResponse.json({
      user: {
        ...transformedUserData,
        verification_status, // Add explicit status field
      },
      verification_log: logsWithProfiles,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
