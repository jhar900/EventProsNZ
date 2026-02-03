import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateApplicationSchema = z.object({
  application_message: z.string().min(1).max(2000).optional(),
  proposed_budget: z.number().min(0).optional(),
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
        { success: false, message: 'Can only edit pending applications' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateApplicationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid data' },
        { status: 400 }
      );
    }

    // Use supabaseAdmin to bypass RLS - we've already verified ownership above
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
