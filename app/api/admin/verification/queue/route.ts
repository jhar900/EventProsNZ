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

    // Use admin client to bypass RLS
    const adminSupabase = authResult.supabase || supabaseAdmin;

    const { searchParams } = new URL(request.url);
    const query = queueQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    const limit = query.limit ? parseInt(query.limit) : 20;
    const offset = query.offset ? parseInt(query.offset) : 0;

    // For status filters, use verification_logs, users.is_verified, and onboarding status
    let userIds: string[] | null = null;
    if (query.status === 'onboarding') {
      // Get contractors who haven't completed onboarding
      // This includes:
      // 1. Contractors with is_submitted = false
      // 2. Contractors without an onboarding status record (haven't started/completed)
      // Excludes:
      // - contractors who are verified
      // - contractors who have completed onboarding (is_submitted = true)
      // - contractors who have been rejected

      // Get all contractors who are not verified
      const { data: allContractors, error: contractorsError } =
        await adminSupabase
          .from('users')
          .select('id')
          .eq('role', 'contractor')
          .eq('is_verified', false);

      if (contractorsError) {
        console.error('Error fetching contractors:', contractorsError);
        userIds = [];
      } else {
        const allContractorIds = new Set(
          (allContractors || []).map((u: any) => u.id)
        );

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
        const { data: rejectedLogs, error: rejectedError } = await adminSupabase
          .from('verification_logs')
          .select('user_id')
          .or('action.eq.reject,status.eq.rejected');

        const rejectedUserIds = new Set(
          (rejectedLogs || []).map((log: any) => log.user_id)
        );

        // Onboarding users are:
        // - Contractors who are not verified AND
        // - (Have is_submitted = false OR don't have an onboarding record)
        // - Exclude those who have completed onboarding (is_submitted = true)
        // - Exclude those who have been rejected
        userIds = Array.from(allContractorIds).filter(id => {
          // Exclude if they've been rejected
          if (rejectedUserIds.has(id)) return false;
          // Exclude if they've completed onboarding
          if (completedOnboardingIds.has(id)) return false;
          // Include if they're explicitly in onboarding (is_submitted = false)
          if (incompleteOnboardingIds.has(id)) return true;
          // Include if they don't have a record (haven't started/completed onboarding)
          return true; // No record means they're still in onboarding
        });
      }

      if (userIds.length === 0) {
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
      // Approved users are those with is_verified = true
      // No need to filter by userIds, we'll use is_verified filter directly
      userIds = null;
    } else if (query.status === 'pending') {
      // For pending, get users who:
      // 1. Are not verified (is_verified = false)
      // 2. Have NOT been rejected
      // 3. Have completed onboarding (for contractors: is_submitted = true)
      // 4. Are not contractors OR are contractors with completed onboarding

      const { data: allUsers, error: allUsersError } = await adminSupabase
        .from('users')
        .select('id, role')
        .eq('is_verified', false);

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

    // Get verification queue
    let queryBuilder = adminSupabase
      .from('users')
      .select(
        `
        id,
        email,
        role,
        is_verified,
        created_at,
        profiles!inner(
          first_name,
          last_name,
          phone,
          address,
          avatar_url
        ),
        business_profiles(
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
      queryBuilder = queryBuilder.eq('is_verified', true);
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

      // Determine verification status with correct priority:
      // 1. Approved (is_verified = true) - highest priority
      // 2. Rejected (has rejection log) - second priority
      // 3. Onboarding (contractor with is_submitted = false or no onboarding record) - third priority
      // 4. Pending (default for unverified users who completed onboarding) - lowest priority
      let verification_status:
        | 'pending'
        | 'approved'
        | 'rejected'
        | 'onboarding' = 'pending';

      // Priority 1: Approved
      if (user.is_verified) {
        verification_status = 'approved';
      }
      // Priority 2: Rejected (check after approved, but before onboarding)
      else if (rejectedUserIds.has(user.id)) {
        verification_status = 'rejected';
      }
      // Priority 3: Onboarding (only for contractors)
      else if (user.role === 'contractor') {
        const isSubmitted = onboardingStatusMap.get(user.id);
        // If explicitly false or undefined (no record), they're in onboarding
        if (isSubmitted === false || isSubmitted === undefined) {
          verification_status = 'onboarding';
        }
        // If submitted but not verified, they're pending
        else if (isSubmitted === true && !user.is_verified) {
          verification_status = 'pending';
        }
      }
      // Priority 4: Pending (default for non-contractors or contractors who completed onboarding)
      else {
        verification_status = 'pending';
      }

      return {
        ...user,
        profiles: profile || null,
        verification_status, // Add explicit status field
      };
    });

    // Get total count with same filters
    let countQuery = adminSupabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (query.status === 'onboarding' && userIds && userIds.length > 0) {
      countQuery = countQuery.in('id', userIds);
    } else if (query.status === 'pending' && userIds && userIds.length > 0) {
      countQuery = countQuery.in('id', userIds);
    } else if (query.status === 'approved') {
      countQuery = countQuery.eq('is_verified', true);
    } else if (query.status === 'rejected' && userIds && userIds.length > 0) {
      countQuery = countQuery.in('id', userIds);
    }

    const { count, error: countError } = await countQuery;

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
