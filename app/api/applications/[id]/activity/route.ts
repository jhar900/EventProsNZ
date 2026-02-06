import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const activitySchema = z.object({
  activity_type: z.enum(['status_change', 'message_sent']),
  old_value: z.string().optional(),
  new_value: z.string().optional(),
  message: z.string().max(2000).optional(),
});

// GET /api/applications/[id]/activity - Fetch activity log for an application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try cookie-based auth first
    const { supabase } = createClient(request);
    let userId: string | null = null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
    } else {
      // Fallback to header-based auth
      const headerUserId = request.headers.get('x-user-id');
      if (headerUserId) {
        const { data: userData, error: userError } =
          await supabaseAdmin.auth.admin.getUserById(headerUserId);
        if (!userError && userData) {
          userId = headerUserId;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this application
    const { data: application } = await supabaseAdmin
      .from('job_applications')
      .select(
        'id, contractor_id, job_id, jobs!job_applications_job_id_fkey(posted_by_user_id)'
      )
      .eq('id', id)
      .single();

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user is job owner
    const jobOwnerId = (application.jobs as any)?.posted_by_user_id;
    const isJobOwner = jobOwnerId === userId;

    // Check if user is contractor
    const { data: businessProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const isContractor =
      businessProfile && application.contractor_id === businessProfile.id;

    if (!isJobOwner && !isContractor) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch activity with actor details
    const { data: activity, error } = await supabaseAdmin
      .from('job_application_activity')
      .select(
        `
        id,
        activity_type,
        old_value,
        new_value,
        message,
        metadata,
        created_at,
        actor_id
      `
      )
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    // Fetch actor profiles separately if we have activity
    let activityWithProfiles = activity || [];
    if (activity && activity.length > 0) {
      const actorIds = [...new Set(activity.map(a => a.actor_id))];
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', actorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      activityWithProfiles = activity.map(a => ({
        ...a,
        actor: {
          id: a.actor_id,
          profiles: profileMap.get(a.actor_id) || null,
        },
      }));
    }

    if (error) {
      console.error('Error fetching activity:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, activity: activityWithProfiles });
  } catch (error) {
    console.error('GET activity error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/applications/[id]/activity - Log a new activity (primarily for messages)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try cookie-based auth first
    const { supabase } = createClient(request);
    let userId: string | null = null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
    } else {
      // Fallback to header-based auth
      const headerUserId = request.headers.get('x-user-id');
      if (headerUserId) {
        const { data: userData, error: userError } =
          await supabaseAdmin.auth.admin.getUserById(headerUserId);
        if (!userError && userData) {
          userId = headerUserId;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = activitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid data',
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // Verify user has access to this application
    const { data: application } = await supabaseAdmin
      .from('job_applications')
      .select(
        'id, contractor_id, job_id, jobs!job_applications_job_id_fkey(posted_by_user_id)'
      )
      .eq('id', id)
      .single();

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user is job owner
    const jobOwnerId = (application.jobs as any)?.posted_by_user_id;
    const isJobOwner = jobOwnerId === userId;

    // Check if user is contractor
    const { data: businessProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const isContractor =
      businessProfile && application.contractor_id === businessProfile.id;

    if (!isJobOwner && !isContractor) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Insert activity
    const { data: activityRecord, error } = await supabaseAdmin
      .from('job_application_activity')
      .insert({
        application_id: id,
        activity_type: validation.data.activity_type,
        actor_id: userId,
        old_value: validation.data.old_value,
        new_value: validation.data.new_value,
        message: validation.data.message,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, activity: activityRecord });
  } catch (error) {
    console.error('POST activity error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
