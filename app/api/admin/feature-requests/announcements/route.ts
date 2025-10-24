import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createAnnouncementSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
  target_audience: z.enum(['all', 'feature_requesters', 'voters', 'specific']),
  scheduled_at: z.string().optional(),
});

const getAnnouncementsSchema = z.object({
  status: z.enum(['draft', 'scheduled', 'sent', 'cancelled']).optional(),
  target_audience: z
    .enum(['all', 'feature_requesters', 'voters', 'specific'])
    .optional(),
  limit: z
    .string()
    .optional()
    .transform(val => Math.min(parseInt(val) || 20, 100)),
  offset: z
    .string()
    .optional()
    .transform(val => parseInt(val) || 0),
});

// GET /api/admin/feature-requests/announcements - Get community announcements
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
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
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = getAnnouncementsSchema.parse(queryParams);

    const { status, target_audience, limit, offset } = validatedParams;

    // Build query
    let query = supabase.from('community_announcements').select(
      `
        *,
        created_by:profiles!community_announcements_created_by_fkey(first_name, last_name)
        `,
      { count: 'exact' }
    );

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (target_audience) {
      query = query.eq('target_audience', target_audience);
    }

    // Apply sorting and pagination
    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const {
      data: announcements,
      error: announcementsError,
      count,
    } = await query;

    if (announcementsError) {
      console.error('Error fetching announcements:', announcementsError);
      return NextResponse.json(
        { error: 'Failed to fetch announcements' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      announcements: announcements || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error(
      'Error in GET /api/admin/feature-requests/announcements:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/feature-requests/announcements - Create community announcement
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
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
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createAnnouncementSchema.parse(body);

    // Create the announcement
    const { data: announcement, error: insertError } = await supabase
      .from('community_announcements')
      .insert({
        title: validatedData.title,
        content: validatedData.content,
        target_audience: validatedData.target_audience,
        scheduled_at: validatedData.scheduled_at || null,
        created_by: user.id,
        status: validatedData.scheduled_at ? 'scheduled' : 'draft',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating announcement:', insertError);
      return NextResponse.json(
        { error: 'Failed to create announcement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
      message: 'Announcement created successfully',
    });
  } catch (error) {
    console.error(
      'Error in POST /api/admin/feature-requests/announcements:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
