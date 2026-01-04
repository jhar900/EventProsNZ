import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/jobs/[id]/applications-list - Get all applications for a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    console.log('[GET /api/jobs/[id]/applications-list] Route handler called');

    // Handle params being a Promise (Next.js 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    const jobId = resolvedParams.id;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get user ID from request headers (same pattern as create-job-application)
    const userId = request.headers.get('x-user-id');
    console.log(
      '[GET /api/jobs/[id]/applications-list] User ID from header:',
      userId
    );

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 401 }
      );
    }

    // Verify user exists (same pattern as create-job-application)
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    console.log(
      '[GET /api/jobs/[id]/applications-list] Authenticated user:',
      userId
    );

    // Verify the user owns this job or is an admin
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('posted_by_user_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if user owns the job or is admin
    const { data: userRoleData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const isOwner = job.posted_by_user_id === userId;
    const isAdmin = userRoleData?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to view applications for this job',
        },
        { status: 403 }
      );
    }

    // Fetch all applications for this job
    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error(
        '[GET /api/jobs/[id]/applications-list] Error fetching applications:',
        applicationsError
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch applications',
          details: applicationsError.message,
        },
        { status: 500 }
      );
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({
        success: true,
        applications: [],
        count: 0,
      });
    }

    // Fetch contractor details for each application
    const contractorIds = [
      ...new Set(applications.map(app => app.contractor_id)),
    ];
    const { data: contractors, error: contractorsError } = await supabaseAdmin
      .from('business_profiles')
      .select(
        `
        id,
        company_name,
        user_id
      `
      )
      .in('id', contractorIds);

    // Fetch user details separately
    const userIds = contractors
      ? [...new Set(contractors.map(c => c.user_id).filter(Boolean))]
      : [];
    const usersMap = new Map();
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', userIds);

      if (!usersError && users) {
        users.forEach(user => {
          usersMap.set(user.id, user);
        });
      }
    }

    if (contractorsError) {
      console.error(
        '[GET /api/jobs/[id]/applications-list] Error fetching contractors:',
        contractorsError
      );
      // Continue without contractor details rather than failing
    }

    // Map contractor data to applications
    const contractorMap = new Map();
    if (contractors) {
      contractors.forEach(contractor => {
        const user = contractor.user_id
          ? usersMap.get(contractor.user_id)
          : null;
        contractorMap.set(contractor.id, {
          id: contractor.id,
          company_name: contractor.company_name,
          user_id: contractor.user_id,
          profile: user
            ? {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                avatar_url: user.avatar_url,
              }
            : null,
        });
      });
    }

    // Combine applications with contractor data
    const applicationsWithContractors = applications.map(app => ({
      ...app,
      contractor: contractorMap.get(app.contractor_id) || null,
    }));

    console.log(
      `[GET /api/jobs/[id]/applications-list] Found ${applicationsWithContractors.length} applications`
    );

    return NextResponse.json({
      success: true,
      applications: applicationsWithContractors,
      count: applicationsWithContractors.length,
    });
  } catch (error) {
    console.error('[GET /api/jobs/[id]/applications-list] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch applications',
      },
      { status: 500 }
    );
  }
}
