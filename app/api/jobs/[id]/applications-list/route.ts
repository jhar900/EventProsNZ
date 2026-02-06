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

    // contractor_id in job_applications references business_profiles(id)
    const contractorIds = [
      ...new Set(applications.map(app => app.contractor_id)),
    ];

    // Fetch business profiles with more details
    const { data: businessProfiles, error: businessProfilesError } =
      await supabaseAdmin
        .from('business_profiles')
        .select(
          'id, company_name, user_id, logo_url, description, website, location, service_categories, average_rating, review_count, is_verified'
        )
        .in('id', contractorIds);

    if (businessProfilesError) {
      console.error(
        '[GET /api/jobs/[id]/applications-list] Error fetching business profiles:',
        businessProfilesError
      );
    }

    // Get user IDs from business profiles to fetch profile details
    const userIds = businessProfiles
      ? [...new Set(businessProfiles.map(bp => bp.user_id).filter(Boolean))]
      : [];

    // Fetch profile details (first_name, last_name, avatar_url, phone, bio, location are in profiles table)
    // profiles.user_id references users.id, so we need to query by user_id
    const { data: profiles, error: profilesError } =
      userIds.length > 0
        ? await supabaseAdmin
            .from('profiles')
            .select(
              'user_id, first_name, last_name, avatar_url, phone, bio, location'
            )
            .in('user_id', userIds)
        : { data: [], error: null };

    if (profilesError) {
      console.error(
        '[GET /api/jobs/[id]/applications-list] Error fetching profiles:',
        profilesError
      );
    }

    // Create maps for easy lookup (keyed by user_id)
    const usersMap = new Map();
    if (profiles) {
      profiles.forEach(profile => {
        usersMap.set(profile.user_id, profile);
      });
    }

    const businessProfilesMap = new Map();
    if (businessProfiles) {
      businessProfiles.forEach(bp => {
        businessProfilesMap.set(bp.id, bp);
      });
    }

    // Combine applications with contractor data (flattened structure for component compatibility)
    const applicationsWithContractors = applications.map(app => {
      const businessProfile = businessProfilesMap.get(app.contractor_id);
      const user = businessProfile
        ? usersMap.get(businessProfile.user_id)
        : null;
      return {
        ...app,
        contractor: businessProfile
          ? {
              id: businessProfile.id,
              company_name: businessProfile.company_name || null,
              company_description: businessProfile.description || null,
              website: businessProfile.website || null,
              company_location: businessProfile.location || null,
              service_categories: businessProfile.service_categories || [],
              is_verified: businessProfile.is_verified || false,
              first_name: user?.first_name || null,
              last_name: user?.last_name || null,
              phone: user?.phone || null,
              bio: user?.bio || null,
              user_location: user?.location || null,
              profile_photo_url:
                businessProfile.logo_url || user?.avatar_url || null,
              avatar_url: user?.avatar_url || null,
              logo_url: businessProfile.logo_url || null,
              average_rating: businessProfile.average_rating || 0,
              review_count: businessProfile.review_count || 0,
            }
          : null,
      };
    });

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
