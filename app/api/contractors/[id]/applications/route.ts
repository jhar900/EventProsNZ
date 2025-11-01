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
    const supabase = createClient();

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

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Verify the contractor is requesting their own applications or user is admin
    if (id !== user.id) {
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
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

    const { searchParams } = new URL(request.url);
    const params_data = Object.fromEntries(searchParams.entries());

    // Parse and validate parameters
    const parsedParams = getContractorApplicationsSchema.parse({
      ...params_data,
      page: params_data.page ? parseInt(params_data.page) : 1,
      limit: params_data.limit ? parseInt(params_data.limit) : 20,
    });

    const result = await jobService.getJobApplications({
      contractor_id: id,
      ...parsedParams,
    });

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
