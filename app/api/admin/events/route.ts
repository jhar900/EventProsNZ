import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Use admin client to bypass RLS for fetching all events
    // First, get events with count
    let query = supabaseAdmin
      .from('events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error: eventsError, count } = await query;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json(
        {
          error: 'Failed to fetch events',
          details: eventsError.message,
        },
        { status: 500 }
      );
    }

    // Fetch user data with profiles and business profiles for event managers
    // Handle both event_manager_id and user_id (in case column name differs)
    const eventManagerIds = [
      ...new Set(
        (events || [])
          .map(e => (e as any).event_manager_id || (e as any).user_id)
          .filter((id): id is string => id != null && id !== 'undefined')
      ),
    ];
    const { data: users, error: usersError } =
      eventManagerIds.length > 0
        ? await supabaseAdmin
            .from('users')
            .select(
              `
              id,
              email,
              created_at,
              profiles (
                first_name,
                last_name,
                avatar_url
              ),
              business_profiles (
                company_name
              )
            `
            )
            .in('id', eventManagerIds)
        : { data: [], error: null };

    if (usersError) {
      console.error('Error fetching users:', usersError);
      // Continue without user data rather than failing
    }

    // Map users to events
    const usersMap = new Map(
      (users || []).map(u => {
        // Handle profiles being an array (Supabase sometimes returns arrays for relations)
        const profile = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
        const businessProfile = Array.isArray(u.business_profiles)
          ? u.business_profiles[0]
          : u.business_profiles;

        return [
          u.id,
          {
            email: u.email,
            created_at: u.created_at,
            profile: profile || null,
            business_profile: businessProfile || null,
          },
        ];
      })
    );

    const eventsWithUsers = (events || []).map(event => {
      const managerId =
        (event as any).event_manager_id || (event as any).user_id;
      return {
        ...event,
        event_manager: usersMap.get(managerId) || null,
      };
    });

    return NextResponse.json({
      events: eventsWithUsers,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
