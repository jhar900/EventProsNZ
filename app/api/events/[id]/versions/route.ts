import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { GetEventVersionsRequest, EventVersionResponse } from '@/types/events';

// Validation schemas
const getVersionsSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
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

    // Validate event ID
    const validationResult = getVersionsSchema.safeParse({ eventId });
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid event ID',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

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

    // Get event versions
    const { data: versions, error: versionsError } = await supabase
      .from('event_versions')
      .select(
        `
        *,
        profiles!event_versions_created_by_fkey (
          first_name,
          last_name
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

    const response: EventVersionResponse = {
      versions: versions || [],
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/events/[id]/versions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
