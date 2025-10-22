import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const jobService = new JobService();

// Validation schema for internal job application
const createInternalJobApplicationSchema = z.object({
  cover_letter: z
    .string()
    .min(1, 'Cover letter is required')
    .max(2000, 'Cover letter too long'),
  proposed_budget: z.number().min(0).optional(),
  availability_start_date: z.string().optional(),
  availability_end_date: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// Validation schema for application filters
const getInternalJobApplicationsSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// POST /api/jobs/internal/[id]/applications - Apply to internal job
export async function POST(
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
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const jobId = params.id;
    const body = await request.json();
    const validatedData = createInternalJobApplicationSchema.parse(body);

    // Verify this is an internal job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('job_type, status, posted_by_user_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Internal job not found',
        },
        { status: 404 }
      );
    }

    if (job.job_type !== 'contractor_internal') {
      return NextResponse.json(
        {
          success: false,
          error: 'This is not an internal job',
        },
        { status: 400 }
      );
    }

    if (job.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'This internal job is no longer accepting applications',
        },
        { status: 400 }
      );
    }

    // Prevent users from applying to their own jobs
    if (job.posted_by_user_id === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You cannot apply to your own internal job',
        },
        { status: 400 }
      );
    }

    // Check if user has already applied
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('contractor_id', user.id)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already applied to this internal job',
        },
        { status: 400 }
      );
    }

    // Create the application
    const application = await jobService.createJobApplication(
      {
        job_id: jobId,
        ...validatedData,
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('POST /api/jobs/internal/[id]/applications error:', error);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
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
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create application',
      },
      { status: 500 }
    );
  }
}

// GET /api/jobs/internal/[id]/applications - Get applications for internal job
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
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const jobId = params.id;
    const { searchParams } = new URL(request.url);
    const params_obj = Object.fromEntries(searchParams.entries());

    // Parse and validate parameters
    const parsedParams = getInternalJobApplicationsSchema.parse({
      ...params_obj,
      page: params_obj.page ? parseInt(params_obj.page) : 1,
      limit: params_obj.limit ? parseInt(params_obj.limit) : 20,
    });

    // Verify this is an internal job and user owns it
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('job_type, posted_by_user_id')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Internal job not found',
        },
        { status: 404 }
      );
    }

    if (job.job_type !== 'contractor_internal') {
      return NextResponse.json(
        {
          success: false,
          error: 'This is not an internal job',
        },
        { status: 400 }
      );
    }

    if (job.posted_by_user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to view applications for this internal job',
        },
        { status: 403 }
      );
    }

    // Get applications for this job
    const result = await jobService.getJobApplications({
      job_id: jobId,
      status: parsedParams.status,
      page: parsedParams.page,
      limit: parsedParams.limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('GET /api/jobs/internal/[id]/applications error:', error);
    }

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
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch applications',
      },
      { status: 500 }
    );
  }
}
