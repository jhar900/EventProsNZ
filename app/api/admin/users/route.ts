import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import {
  validateAdminAccess,
  logAdminAction,
} from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use comprehensive admin authorization middleware
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { supabase, user } = authResult;

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
    let query = supabase.from('users').select(
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
          city,
          state,
          country
        ),
        business_profiles (
          company_name,
          subscription_tier,
          website,
          description
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
      } else {
        query = query.eq('status', status);
      }
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
      query = query.or(
        `profiles.city.ilike.%${location}%,profiles.state.ilike.%${location}%,profiles.country.ilike.%${location}%`
      );
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

    // Apply search
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,profiles.first_name.ilike.%${search}%,profiles.last_name.ilike.%${search}%,business_profiles.company_name.ilike.%${search}%`
      );
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

    // Log admin search action
    await logAdminAction(
      supabase,
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

    return NextResponse.json({
      users: users || [],
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
