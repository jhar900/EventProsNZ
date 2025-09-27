import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createVersionSchema = z.object({
  changes: z.record(z.any()),
  reason: z.string().optional(),
});

// GET /api/events/[id]/versions - Get event version history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    // Check if event exists and user has access
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_manager_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Event not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch event' },
        { status: 500 }
      );
    }

    // Check permissions
    if (event.event_manager_id !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Get version history
    const { data: versions, error: versionsError } = await supabase
      .from('event_versions')
      .select(
        `
        *,
        profiles!event_versions_created_by_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .eq('event_id', eventId)
      .order('version_number', { ascending: false });

    if (versionsError) {
      console.error('Error fetching versions:', versionsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch versions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      versions: versions || [],
      total: versions?.length || 0,
      success: true,
    });
  } catch (error) {
    console.error('Error in GET /api/events/[id]/versions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/versions - Create new version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createVersionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { changes, reason } = validationResult.data;

    // Check if event exists and user has access
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('event_manager_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Event not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch event' },
        { status: 500 }
      );
    }

    // Check permissions
    if (event.event_manager_id !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Get next version number
    const { data: lastVersion, error: versionError } = await supabase
      .from('event_versions')
      .select('version_number')
      .eq('event_id', eventId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1;

    // Create new version
    const { data: version, error: createError } = await supabase
      .from('event_versions')
      .insert({
        event_id: eventId,
        version_number: nextVersionNumber,
        changes: {
          ...changes,
          reason: reason,
          created_at: new Date().toISOString(),
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating version:', createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create version' },
        { status: 500 }
      );
    }

    // Create notification for contractors about the change
    const { data: contractors } = await supabase
      .from('event_contractor_matches')
      .select('contractor_id')
      .eq('event_id', eventId)
      .eq('status', 'accepted');

    if (contractors && contractors.length > 0) {
      const notifications = contractors.map(contractor => ({
        event_id: eventId,
        contractor_id: contractor.contractor_id,
        notification_type: 'event_updated',
        message: 'Event has been updated. Please review the changes.',
      }));

      const { error: notificationError } = await supabase
        .from('event_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
      }
    }

    return NextResponse.json({
      version,
      success: true,
      message: 'Version created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/events/[id]/versions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
