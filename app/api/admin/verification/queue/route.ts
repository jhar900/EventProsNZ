import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { z } from 'zod';

const queueQuerySchema = z.object({
  status: z
    .enum(['pending', 'approved', 'rejected', 'onboarding', 'all'])
    .optional(),
  priority: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const query = queueQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    const limit = query.limit ? parseInt(query.limit) : 20;
    const offset = query.offset ? parseInt(query.offset) : 0;

    // For status filters, use verification_logs, business_profiles.is_verified, and onboarding status
    let userIds: string[] | null = null;
    if (query.status === 'onboarding') {
      // Get contractors and event managers who haven't completed onboarding
      // This includes:
      // 1. Contractors with is_submitted = false
      // 2. Contractors without an onboarding status record (haven't started/completed)
      // 3. Event managers without onboarding_completed = true
      // Excludes:
      // - users who are verified (business_profiles.is_verified = true)
      // - contractors who have completed onboarding (is_submitted = true)
      // - event managers who have completed onboarding (onboarding_completed = true)
      // - users who have been rejected

      // Get all users with unverified business profiles
      const { data: unverifiedBusinessProfiles, error: bpError } =
        await adminSupabase
          .from('business_profiles')
          .select('user_id')
          .eq('is_verified', false);

      if (bpError) {
        console.error('Error fetching business profiles:', bpError);
        userIds = [];
      } else {
        // Get user IDs for contractors and event managers
        const unverifiedUserIds = (unverifiedBusinessProfiles || []).map(
          (bp: any) => bp.user_id
        );

        // If no unverified business profiles, return empty result
        if (unverifiedUserIds.length === 0) {
          userIds = [];
        } else {
          const { data: users, error: usersError } = await adminSupabase
            .from('users')
            .select('id, role')
            .in('id', unverifiedUserIds)
            .in('role', ['contractor', 'event_manager']);

          if (usersError) {
            console.error('Error fetching users:', usersError);
            userIds = [];
          } else {
            const contractorIds = new Set(
              (users || [])
                .filter((u: any) => u.role === 'contractor')
                .map((u: any) => u.id)
            );
            const eventManagerIds = new Set(
              (users || [])
                .filter((u: any) => u.role === 'event_manager')
                .map((u: any) => u.id)
            );
            const allUserIds = new Set([...contractorIds, ...eventManagerIds]);

            // Get contractors who have completed onboarding (is_submitted = true) - exclude these
            const { data: completedOnboarding, error: completedError } =
              await adminSupabase
                .from('contractor_onboarding_status')
                .select('user_id')
                .eq('is_submitted', true);

            const completedOnboardingIds = new Set(
              (completedOnboarding || []).map((status: any) => status.user_id)
            );

            // Get contractors with is_submitted = false (explicitly in onboarding)
            const { data: incompleteOnboarding, error: incompleteError } =
              await adminSupabase
                .from('contractor_onboarding_status')
                .select('user_id')
                .eq('is_submitted', false);

            const incompleteOnboardingIds = new Set(
              (incompleteOnboarding || []).map((status: any) => status.user_id)
            );

            // Get rejected users - exclude these from onboarding
            const { data: rejectedLogs, error: rejectedError } =
              await adminSupabase
                .from('verification_logs')
                .select('user_id')
                .or('action.eq.reject,status.eq.rejected');

            const rejectedUserIds = new Set(
              (rejectedLogs || []).map((log: any) => log.user_id)
            );

            // Get previously approved users - exclude these from onboarding (they should be pending)
            const { data: approvedLogs } = await adminSupabase
              .from('verification_logs')
              .select('user_id')
              .or('action.eq.approve,status.eq.approved');

            const previouslyApprovedUserIds = new Set(
              (approvedLogs || []).map((log: any) => log.user_id)
            );

            // Get event managers who have completed onboarding (to exclude them)
            let completedEventManagerIds = new Set<string>();
            if (eventManagerIds.size > 0) {
              const { data: eventManagerProfiles } = await adminSupabase
                .from('profiles')
                .select('user_id, preferences')
                .in('user_id', Array.from(eventManagerIds));

              if (eventManagerProfiles) {
                completedEventManagerIds = new Set(
                  eventManagerProfiles
                    .filter(
                      (p: any) =>
                        (p.preferences as any)?.onboarding_completed === true
                    )
                    .map((p: any) => p.user_id)
                );
              }
            }

            // Onboarding users are:
            // - Contractors who are not verified AND
            //   (Have is_submitted = false OR don't have an onboarding record)
            // - Event managers who are not verified AND
            //   (Have onboarding_completed = false or null)
            // - Exclude those who have completed onboarding
            // - Exclude those who have been rejected
            // - Exclude those who were previously approved (they should be pending, not onboarding)
            userIds = Array.from(allUserIds).filter(id => {
              // Exclude if they've been rejected
              if (rejectedUserIds.has(id)) return false;
              // Exclude if they were previously approved (they should be pending, not onboarding)
              if (previouslyApprovedUserIds.has(id)) return false;

              // Handle contractors
              if (contractorIds.has(id)) {
                // Exclude if they've completed onboarding
                if (completedOnboardingIds.has(id)) return false;
                // Include if they're explicitly in onboarding (is_submitted = false)
                if (incompleteOnboardingIds.has(id)) return true;
                // Include if they don't have a record (haven't started/completed onboarding)
                return true; // No record means they're still in onboarding
              }

              // Handle event managers
              if (eventManagerIds.has(id)) {
                // Exclude if they've completed onboarding
                if (completedEventManagerIds.has(id)) return false;
                // Include if they haven't completed onboarding
                return true;
              }

              return false;
            });
          }
        }
      }

      if (!userIds || userIds.length === 0) {
        return NextResponse.json({
          verifications: [],
          total: 0,
        });
      }
    } else if (query.status === 'rejected') {
      // Get users who have been rejected in verification_logs
      const { data: rejectedLogs, error: logsError } = await adminSupabase
        .from('verification_logs')
        .select('user_id')
        .or('action.eq.reject,status.eq.rejected');

      if (logsError) {
        console.error('Error fetching rejected logs:', logsError);
        // If verification_logs doesn't exist, return empty result
        return NextResponse.json({
          verifications: [],
          total: 0,
        });
      }

      userIds = rejectedLogs?.map(item => item.user_id) || [];
      // Remove duplicates
      userIds = [...new Set(userIds)];
      // If no rejected users, return empty result
      if (userIds.length === 0) {
        return NextResponse.json({
          verifications: [],
          total: 0,
        });
      }
    } else if (query.status === 'approved') {
      // Approved users are those with business_profiles.is_verified = true
      // No need to filter by userIds, we'll use business_profiles.is_verified filter directly
      userIds = null;
    } else if (query.status === 'pending') {
      // For pending, get users who:
      // 1. Have unverified business profiles (business_profiles.is_verified = false)
      // 2. Have NOT been rejected
      // 3. Have completed onboarding (for contractors: is_submitted = true)
      // 4. Are not contractors OR are contractors with completed onboarding

      // Get all users with unverified business profiles
      const { data: unverifiedBusinessProfiles, error: bpError } =
        await adminSupabase
          .from('business_profiles')
          .select('user_id')
          .eq('is_verified', false);

      if (bpError) {
        return NextResponse.json(
          { error: 'Failed to fetch business profiles' },
          { status: 400 }
        );
      }

      const unverifiedUserIds = (unverifiedBusinessProfiles || []).map(
        (bp: any) => bp.user_id
      );

      // If no unverified business profiles, return empty result
      if (unverifiedUserIds.length === 0) {
        return NextResponse.json({
          verifications: [],
          total: 0,
        });
      }

      // Get user details for these IDs
      const { data: allUsers, error: allUsersError } = await adminSupabase
        .from('users')
        .select('id, role')
        .in('id', unverifiedUserIds);

      if (allUsersError) {
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 400 }
        );
      }

      // Get rejected user IDs
      const { data: rejectedLogs, error: logsError } = await adminSupabase
        .from('verification_logs')
        .select('user_id')
        .or('action.eq.reject,status.eq.rejected');

      const rejectedIds = logsError
        ? new Set<string>()
        : new Set((rejectedLogs || []).map((log: any) => log.user_id));

      // Get contractors who have completed onboarding (is_submitted = true)
      const { data: completedOnboarding } = await adminSupabase
        .from('contractor_onboarding_status')
        .select('user_id')
        .eq('is_submitted', true);

      const completedOnboardingIds = new Set(
        (completedOnboarding || []).map((status: any) => status.user_id)
      );

      // Get contractors who haven't completed onboarding (to exclude them)
      const { data: incompleteOnboarding } = await adminSupabase
        .from('contractor_onboarding_status')
        .select('user_id')
        .eq('is_submitted', false);

      const incompleteOnboardingIds = new Set(
        (incompleteOnboarding || []).map((status: any) => status.user_id)
      );

      // Filter: pending users are unverified, not rejected, and:
      // - Non-contractors, OR
      // - Contractors who have completed onboarding (is_submitted = true)
      userIds = (allUsers || [])
        .map((u: any) => u.id)
        .filter((id: string) => {
          // Exclude rejected users
          if (rejectedIds.has(id)) return false;

          // For contractors: must have completed onboarding
          const user = allUsers?.find((u: any) => u.id === id);
          if (user?.role === 'contractor') {
            // Exclude if explicitly in onboarding (is_submitted = false)
            if (incompleteOnboardingIds.has(id)) return false;
            // Include if completed onboarding (is_submitted = true)
            if (completedOnboardingIds.has(id)) return true;
            // If no onboarding record exists, exclude (they're still in onboarding)
            return false;
          }

          // Non-contractors are pending if not rejected
          return true;
        });

      if (userIds.length === 0) {
        return NextResponse.json({
          verifications: [],
          total: 0,
        });
      }
    }

    // Get verification queue - join with business_profiles to filter by its is_verified
    let queryBuilder = adminSupabase
      .from('users')
      .select(
        `
        id,
        email,
        role,
        created_at,
        profiles!inner(
          first_name,
          last_name,
          phone,
          address,
          avatar_url
        ),
        business_profiles!inner(
          company_name,
          business_address,
          nzbn,
          description,
          service_areas,
          is_verified
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply status filter
    if (query.status === 'onboarding' && userIds && userIds.length > 0) {
      queryBuilder = queryBuilder.in('id', userIds);
    } else if (query.status === 'pending' && userIds && userIds.length > 0) {
      queryBuilder = queryBuilder.in('id', userIds);
    } else if (query.status === 'approved') {
      // Filter by business_profiles.is_verified = true
      queryBuilder = queryBuilder.eq('business_profiles.is_verified', true);
    } else if (query.status === 'rejected' && userIds && userIds.length > 0) {
      queryBuilder = queryBuilder.in('id', userIds);
    }
    // 'all' or undefined means no filter applied

    const { data: users, error: usersError } = await queryBuilder;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        {
          error: 'Failed to fetch verification queue',
          details: usersError.message,
        },
        { status: 400 }
      );
    }

    // Get all rejected user IDs to determine status
    const { data: rejectedLogs } = await adminSupabase
      .from('verification_logs')
      .select('user_id')
      .or('action.eq.reject,status.eq.rejected');

    const rejectedUserIds = new Set(
      (rejectedLogs || []).map((log: any) => log.user_id)
    );

    // Get all previously approved user IDs to determine if they should be pending (not onboarding) when unapproved
    const { data: approvedLogs } = await adminSupabase
      .from('verification_logs')
      .select('user_id')
      .or('action.eq.approve,status.eq.approved');

    const previouslyApprovedUserIds = new Set(
      (approvedLogs || []).map((log: any) => log.user_id)
    );

    // Get onboarding status for all contractors in the result set
    const contractorUserIds = (users || [])
      .filter((u: any) => u.role === 'contractor')
      .map((u: any) => u.id);

    let onboardingStatusMap = new Map<string, boolean>();
    if (contractorUserIds.length > 0) {
      const { data: onboardingStatuses } = await adminSupabase
        .from('contractor_onboarding_status')
        .select('user_id, is_submitted')
        .in('user_id', contractorUserIds);

      if (onboardingStatuses) {
        onboardingStatusMap = new Map(
          onboardingStatuses.map((status: any) => [
            status.user_id,
            status.is_submitted,
          ])
        );
      }
    }

    // Transform users data - ensure profiles is an object, not an array
    const transformedUsers = (users || []).map((user: any) => {
      // Supabase returns profiles as an array even for one-to-one relationships
      const profile = Array.isArray(user.profiles)
        ? user.profiles[0]
        : user.profiles;

      // Get business profile is_verified status
      const businessProfile = Array.isArray(user.business_profiles)
        ? user.business_profiles[0]
        : user.business_profiles;
      const isBusinessVerified = businessProfile?.is_verified || false;

      // Determine verification status with correct priority:
      // 1. Approved (business_profiles.is_verified = true) - highest priority
      // 2. Rejected (has rejection log) - second priority
      // 3. Onboarding (contractor with is_submitted = false or no onboarding record) - third priority
      // 4. Pending (default for unverified users who completed onboarding) - lowest priority
      let verification_status:
        | 'pending'
        | 'approved'
        | 'rejected'
        | 'onboarding' = 'pending';

      // Priority 1: Approved
      if (isBusinessVerified) {
        verification_status = 'approved';
      }
      // Priority 2: Rejected (check after approved, but before onboarding)
      else if (rejectedUserIds.has(user.id)) {
        verification_status = 'rejected';
      }
      // Priority 3: Onboarding (for contractors and event managers)
      else if (user.role === 'contractor') {
        const isSubmitted = onboardingStatusMap.get(user.id);
        // If they were previously approved, they should be pending (not onboarding) when unapproved
        if (previouslyApprovedUserIds.has(user.id) && !isBusinessVerified) {
          verification_status = 'pending';
        }
        // If explicitly false or undefined (no record), they're in onboarding
        else if (isSubmitted === false || isSubmitted === undefined) {
          verification_status = 'onboarding';
        }
        // If submitted but not verified, they're pending
        else if (isSubmitted === true && !isBusinessVerified) {
          verification_status = 'pending';
        }
      }
      // Event managers: check if they've completed onboarding
      else if (user.role === 'event_manager') {
        const profile = Array.isArray(user.profiles)
          ? user.profiles[0]
          : user.profiles;
        const onboardingCompleted = (profile?.preferences as any)
          ?.onboarding_completed;

        // If they were previously approved, they should be pending (not onboarding) when unapproved
        if (previouslyApprovedUserIds.has(user.id) && !isBusinessVerified) {
          verification_status = 'pending';
        }
        // If they haven't completed onboarding, they're in onboarding
        else if (!onboardingCompleted) {
          verification_status = 'onboarding';
        }
        // If they've completed onboarding but business is not verified, they're pending
        else if (onboardingCompleted && !isBusinessVerified) {
          verification_status = 'pending';
        }
      }
      // Priority 4: Pending (default for other roles or contractors who completed onboarding)
      else {
        verification_status = 'pending';
      }

      return {
        ...user,
        profiles: profile || null,
        business_profiles: businessProfile || null,
        is_verified: isBusinessVerified, // Add for backward compatibility
        verification_status, // Add explicit status field
      };
    });

    // Get total count with same filters
    // For counts, we need to query business_profiles and count distinct user_ids
    let count: number | null = 0;
    let countError: any = null;

    if (query.status === 'onboarding' && userIds && userIds.length > 0) {
      // Count only users who have business_profiles (matching the main query filter)
      const { count: onboardingCount, error: err } = await adminSupabase
        .from('business_profiles')
        .select('user_id', { count: 'exact', head: true })
        .in('user_id', userIds);
      count = onboardingCount;
      countError = err;
    } else if (query.status === 'pending' && userIds && userIds.length > 0) {
      // Count only users who have business_profiles (matching the main query filter)
      const { count: pendingCount, error: err } = await adminSupabase
        .from('business_profiles')
        .select('user_id', { count: 'exact', head: true })
        .in('user_id', userIds);
      count = pendingCount;
      countError = err;
    } else if (query.status === 'approved') {
      // Count users with verified business profiles
      const { count: approvedCount, error: err } = await adminSupabase
        .from('business_profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('is_verified', true);
      count = approvedCount;
      countError = err;
    } else if (query.status === 'rejected' && userIds && userIds.length > 0) {
      // Count only rejected users who have business_profiles (matching the main query filter)
      const { count: rejectedCount, error: err } = await adminSupabase
        .from('business_profiles')
        .select('user_id', { count: 'exact', head: true })
        .in('user_id', userIds);
      count = rejectedCount;
      countError = err;
    } else {
      // For 'all' or no filter, count all users with business profiles
      const { count: allCount, error: err } = await adminSupabase
        .from('business_profiles')
        .select('user_id', { count: 'exact', head: true });
      count = allCount;
      countError = err;
    }

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to get total count' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verifications: transformedUsers || [],
      total: count || 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
