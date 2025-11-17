import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
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

    // Fetch user emails for event managers
    const eventManagerIds = [
      ...new Set((events || []).map(e => e.event_manager_id)),
    ];
    const { data: users, error: usersError } =
      eventManagerIds.length > 0
        ? await supabaseAdmin
            .from('users')
            .select('id, email, created_at')
            .in('id', eventManagerIds)
        : { data: [], error: null };

    if (usersError) {
      console.error('Error fetching users:', usersError);
      // Continue without user data rather than failing
    }

    // Map users to events
    const usersMap = new Map(
      (users || []).map(u => [
        u.id,
        { email: u.email, created_at: u.created_at },
      ])
    );

    const eventsWithUsers = (events || []).map(event => ({
      ...event,
      users: usersMap.get(event.event_manager_id) || null,
    }));

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
