import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const jobService = new JobService();

// Validation schemas
const getContractorApplicationsSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// GET /api/contractors/[id]/applications - Get contractor's applications
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');

    let supabase;
    if (userId) {
      // Use service role client if we have user ID from header
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      supabase = supabaseAdmin;
    } else {
      // Fallback to middleware client for cookie-based auth
      const { createClient } = await import('@/lib/supabase/middleware');
      const { supabase: middlewareSupabase } = createClient(request);
      const {
        data: { user },
        error: authError,
      } = await middlewareSupabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
      supabase = middlewareSupabase;
      userId = user.id;
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // The 'id' param could be either user.id or business_profiles.id
    // We need to determine which one it is and get the business_profiles.id
    let contractorId: string;

    // First, check if it's a business_profiles.id (UUID format)
    // If not, assume it's a user.id and look up the business profile
    const { data: businessProfile, error: businessProfileError } =
      await supabase
        .from('business_profiles')
        .select('id, user_id')
        .eq('id', id)
        .single();

    if (businessProfile && !businessProfileError) {
      // The id is already a business_profiles.id
      contractorId = businessProfile.id;

      // Verify the user is requesting their own applications or is admin
      if (businessProfile.user_id !== userId) {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (userData?.role !== 'admin') {
          return NextResponse.json(
            {
              success: false,
              message: 'Unauthorized to view these applications',
            },
            { status: 403 }
          );
        }
      }
    } else {
      // The id is likely a user.id, so look up the business profile
      console.log(
        '[GET /api/contractors/[id]/applications] Looking up business profile for user_id:',
        id
      );
      const { data: userBusinessProfile, error: userBusinessProfileError } =
        await supabase
          .from('business_profiles')
          .select('id, user_id')
          .eq('user_id', id)
          .single();

      if (userBusinessProfileError || !userBusinessProfile) {
        console.error(
          '[GET /api/contractors/[id]/applications] Business profile lookup error:',
          userBusinessProfileError
        );
        return NextResponse.json(
          {
            success: false,
            message: 'Business profile not found for this user',
          },
          { status: 404 }
        );
      }

      contractorId = userBusinessProfile.id;
      console.log(
        '[GET /api/contractors/[id]/applications] Found business profile ID:',
        contractorId,
        'for user_id:',
        id
      );

      // Verify the user is requesting their own applications or is admin
      if (userBusinessProfile.user_id !== userId) {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (userData?.role !== 'admin') {
          return NextResponse.json(
            {
              success: false,
              message: 'Unauthorized to view these applications',
            },
            { status: 403 }
          );
        }
      }
    }

    const { searchParams } = new URL(request.url);
    const params_data = Object.fromEntries(searchParams.entries());

    // Parse and validate parameters
    const parsedParams = getContractorApplicationsSchema.parse({
      ...params_data,
      page: params_data.page ? parseInt(params_data.page) : 1,
      limit: params_data.limit ? parseInt(params_data.limit) : 20,
    });

    console.log(
      '[GET /api/contractors/[id]/applications] Fetching applications with contractor_id:',
      contractorId
    );
    const result = await jobService.getJobApplications({
      contractor_id: contractorId, // Use business_profiles.id
      ...parsedParams,
    });

    console.log(
      '[GET /api/contractors/[id]/applications] Found',
      result.applications?.length || 0,
      'applications'
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('GET /api/contractors/[id]/applications error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Return empty results instead of 500 error for better UX
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 20;

    return NextResponse.json({
      success: true,
      applications: [],
      total: 0,
      page,
      limit,
      total_pages: 0,
    });
  }
}
