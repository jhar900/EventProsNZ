import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  validateAdminAccess,
  logAdminAction,
} from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }
    const { supabase, user } = authResult;

    return await processAdminUsersRequest(request, supabase, user);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processAdminUsersRequest(
  request: NextRequest,
  dbClient: any,
  user: any
) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const verification = searchParams.get('verification');
    const subscription = searchParams.get('subscription');
    const location = searchParams.get('location');
    const company = searchParams.get('company');
    const lastLogin = searchParams.get('lastLogin');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = dbClient.from('users').select(
      `
        id,
        email,
        role,
        is_verified,
        status,
        last_login,
        created_at,
        updated_at,
        profiles (
          first_name,
          last_name,
          avatar_url,
          phone,
          address,
          location
        ),
        business_profiles (
          company_name,
          subscription_tier,
          website,
          description,
          logo_url
        )
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (status && status !== 'all') {
      if (status === 'verified') {
        query = query.eq('is_verified', true);
      } else if (status === 'unverified') {
        query = query.eq('is_verified', false);
      }
      // Note: No status column exists, so we only filter by verification status
    }

    if (verification && verification !== 'all') {
      if (verification === 'verified') {
        query = query.eq('is_verified', true);
      } else if (verification === 'unverified') {
        query = query.eq('is_verified', false);
      } else if (verification === 'pending') {
        // Add logic for pending verification status
        query = query.eq('is_verified', false);
      }
    }

    if (subscription && subscription !== 'all') {
      query = query.eq('business_profiles.subscription_tier', subscription);
    }

    if (location) {
      query = query.ilike('profiles.location', `%${location}%`);
    }

    if (company) {
      query = query.ilike('business_profiles.company_name', `%${company}%`);
    }

    if (lastLogin && lastLogin !== 'all') {
      const now = new Date();
      let dateFilter: Date;

      switch (lastLogin) {
        case 'today':
          dateFilter = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'never':
          query = query.is('last_login', null);
          break;
        default:
          dateFilter = new Date(0);
      }

      if (lastLogin !== 'never') {
        query = query.gte('last_login', dateFilter.toISOString());
      }
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply search - only filter by email server-side.
    // Name and company filtering is handled client-side in the component.
    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    // Get all rejected user IDs to determine verification status
    const { data: rejectedLogs } = await dbClient
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
      const { data: onboardingStatuses } = await dbClient
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

    // Transform users data to include verification_status
    const transformedUsers = (users || []).map((user: any) => {
      // Supabase returns profiles as an array even for one-to-one relationships
      const profile = Array.isArray(user.profiles)
        ? user.profiles[0]
        : user.profiles;

      // Supabase returns business_profiles as an array even for one-to-one relationships
      const businessProfile = Array.isArray(user.business_profiles)
        ? user.business_profiles[0]
        : user.business_profiles;

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
        status: user.status || 'active', // Include status field, default to 'active'
        profiles: profile || null,
        business_profiles: businessProfile || null,
        verification_status,
      };
    });

    // Log admin search action
    try {
      await logAdminAction(
        supabaseAdmin,
        user.id,
        'search_users',
        {
          filters: {
            role,
            status,
            verification,
            subscription,
            location,
            company,
            lastLogin,
            dateFrom,
            dateTo,
            search,
            sortBy,
            sortOrder,
          },
          result_count: count || 0,
        },
        request
      );
    } catch (logError) {
      // Ignore logging errors
    }

    return NextResponse.json({
      users: transformedUsers || [],
      total: count || 0,
      limit,
      offset,
      filters: {
        role,
        status,
        verification,
        subscription,
        location,
        company,
        lastLogin,
        dateFrom,
        dateTo,
        search,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
