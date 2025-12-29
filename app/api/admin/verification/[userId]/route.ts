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

    // Always use admin client to bypass RLS for data queries
    // The validateAdminAccess only checks authorization, but we need admin client for queries
    const adminSupabase = supabaseAdmin;

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
        .select(
          'is_submitted, step1_completed, step2_completed, step3_completed, step4_completed'
        )
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

    // Determine verification status based on business_profiles.is_verified, logs, and onboarding
    // Priority: business_profiles.is_verified > rejected (has rejection log) > onboarding status > pending
    const isBusinessVerified = businessProfileData?.is_verified || false;

    let verification_status:
      | 'pending'
      | 'approved'
      | 'rejected'
      | 'onboarding' = 'pending';

    // Priority 1: Approved (business_profiles.is_verified = true)
    if (isBusinessVerified) {
      verification_status = 'approved';
    }
    // Priority 2: Rejected (check for rejection log)
    else if (verificationLog && verificationLog.length > 0) {
      const mostRecentRejection = verificationLog.find(
        (log: any) => log.action === 'reject' || log.status === 'rejected'
      );
      const mostRecentApproval = verificationLog.find(
        (log: any) => log.action === 'approve' || log.status === 'approved'
      );

      // If there's a rejection and no approval after it, status is rejected
      if (mostRecentRejection) {
        if (
          !mostRecentApproval ||
          new Date(mostRecentRejection.created_at) >
            new Date(mostRecentApproval.created_at)
        ) {
          verification_status = 'rejected';
        }
      }
    }

    // Priority 3: Onboarding (for contractors and event managers who haven't completed onboarding)
    // Check if they were previously approved - if so, they should be pending, not onboarding
    const { data: approvedLogs } = await supabaseAdmin
      .from('verification_logs')
      .select('user_id')
      .eq('user_id', userId)
      .or('action.eq.approve,status.eq.approved')
      .limit(1);

    const wasPreviouslyApproved = approvedLogs && approvedLogs.length > 0;

    if (
      verification_status !== 'approved' &&
      verification_status !== 'rejected' &&
      !wasPreviouslyApproved
    ) {
      // Handle contractors
      if (userData.role === 'contractor') {
        // If they have an onboarding record and is_submitted is false, they're in onboarding
        // If they don't have an onboarding record at all, they're also in onboarding (haven't started)
        if (!onboardingStatus || !onboardingStatus.is_submitted) {
          verification_status = 'onboarding';
        }
      }
      // Handle event managers
      else if (userData.role === 'event_manager') {
        // Get profile to check onboarding completion status
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('preferences')
          .eq('user_id', userId)
          .maybeSingle();

        const onboardingCompleted = (profile?.preferences as any)
          ?.onboarding_completed;

        // If they haven't completed onboarding, they're in onboarding
        if (!onboardingCompleted) {
          verification_status = 'onboarding';
        }
      }
    }

    // Priority 4: Pending (default for unverified users who completed onboarding)
    if (verification_status === 'pending' && !isBusinessVerified) {
      verification_status = 'pending';
    }

    return NextResponse.json({
      user: {
        ...transformedUserData,
        verification_status, // Add explicit status field
        contractor_onboarding_status: onboardingStatus, // Include onboarding step data
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
