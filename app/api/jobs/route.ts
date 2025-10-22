import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const jobService = new JobService();

// Validation schemas
const getJobsSchema = z.object({
  job_type: z.enum(['event_manager', 'contractor_internal']).optional(),
  service_category: z.string().optional(),
  location: z.string().optional(),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  is_remote: z.boolean().optional(),
  status: z.enum(['active', 'filled', 'completed', 'cancelled']).optional(),
  posted_by_user_id: z.string().uuid().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z
    .enum(['created_at', 'budget_range_min', 'title'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  q: z.string().optional(),
});

// GET /api/jobs - Get jobs with filtering and search
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user (optional for public job listings)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Parse and validate parameters
    const parsedParams = getJobsSchema.parse({
      ...params,
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 20,
      budget_min: params.budget_min ? parseFloat(params.budget_min) : undefined,
      budget_max: params.budget_max ? parseFloat(params.budget_max) : undefined,
      is_remote: params.is_remote ? params.is_remote === 'true' : undefined,
    });

    // If there's a search query, use searchJobs, otherwise use getJobs
    let result;
    if (parsedParams.q) {
      result = await jobService.searchJobs(parsedParams);
    } else {
      result = await jobService.getJobs(parsedParams);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('GET /api/jobs error:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
      },
      { status: 500 }
    );
  }
}
