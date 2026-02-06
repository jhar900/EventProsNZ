import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for contractor updates (editing their own application)
const contractorUpdateSchema = z.object({
  application_message: z.string().min(1).max(2000).optional(),
  proposed_budget: z.number().min(0).optional(),
});

// Schema for job owner updates (changing application status)
const jobOwnerUpdateSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']),
  notes: z.string().max(2000).optional(),
});

// GET /api/applications/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = createClient(request);

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

    // Get the user's business profile ID (contractor_id stores business_profiles.id, not users.id)
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!businessProfile) {
      return NextResponse.json(
        { success: false, message: 'Business profile not found' },
        { status: 404 }
      );
    }

    const { data: application, error } = await supabase
      .from('job_applications')
      .select('*, job:jobs!job_applications_job_id_fkey(id, title, status)')
      .eq('id', id)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.contractor_id !== businessProfile.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/applications/[id]
export async function PUT(
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
      // Fallback to header-based auth (same pattern as applications-list)
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

    // Get the application with job info to check permissions
    const { data: existing } = await supabaseAdmin
      .from('job_applications')
      .select(
        'contractor_id, status, job_id, jobs!job_applications_job_id_fkey(posted_by_user_id)'
      )
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user is the job owner (can update status)
    const jobOwnerId = (existing.jobs as any)?.posted_by_user_id;
    const isJobOwner = jobOwnerId === userId;

    // Check if user is the contractor (can edit their application)
    const { data: businessProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    const isContractor =
      businessProfile && existing.contractor_id === businessProfile.id;

    // Job owner updating application status
    if (isJobOwner && body.status) {
      const validation = jobOwnerUpdateSchema.safeParse(body);
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

      const oldStatus = existing.status;
      const newStatus = validation.data.status;

      const { data: application, error: updateError } = await supabaseAdmin
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      // Log status change activity
      if (oldStatus !== newStatus) {
        await supabaseAdmin.from('job_application_activity').insert({
          application_id: id,
          activity_type: 'status_change',
          actor_id: userId,
          old_value: oldStatus,
          new_value: newStatus,
        });
      }

      return NextResponse.json({ success: true, application });
    }

    // Contractor editing their own application
    if (isContractor) {
      if (existing.status !== 'pending') {
        return NextResponse.json(
          { success: false, message: 'Can only edit pending applications' },
          { status: 400 }
        );
      }

      const validation = contractorUpdateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, message: 'Invalid data' },
          { status: 400 }
        );
      }

      const { data: application, error: updateError } = await supabaseAdmin
        .from('job_applications')
        .update(validation.data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, application });
    }

    // Neither job owner nor contractor
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 403 }
    );
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = createClient(request);

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

    // Get the user's business profile ID (contractor_id stores business_profiles.id, not users.id)
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!businessProfile) {
      return NextResponse.json(
        { success: false, message: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Check ownership - compare contractor_id with business_profiles.id
    const { data: existing } = await supabase
      .from('job_applications')
      .select('contractor_id, status')
      .eq('id', id)
      .single();

    if (!existing || existing.contractor_id !== businessProfile.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (existing.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Can only delete pending applications' },
        { status: 400 }
      );
    }

    // Use supabaseAdmin to bypass RLS - we've already verified ownership above
    const { error } = await supabaseAdmin
      .from('job_applications')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
