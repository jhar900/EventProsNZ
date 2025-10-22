import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/server';
import { sanitizeJobDescription } from '@/lib/security/sanitization';
import { z } from 'zod';

const jobService = new JobService();

// Validation schemas
const createJobApplicationSchema = z.object({
  cover_letter: z
    .string()
    .min(1, 'Cover letter is required')
    .max(2000, 'Cover letter too long'),
  proposed_budget: z.number().min(0).optional(),
  availability_start_date: z.string().optional(),
  availability_end_date: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

const getJobApplicationsSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// GET /api/jobs/[id]/applications - Get applications for a job
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
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Convert string parameters to appropriate types
    const processedParams = {
      ...queryParams,
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
    };

    const validationResult =
      getJobApplicationsSchema.safeParse(processedParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors:
            validationResult.error.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const result = await jobService.getJobApplications({
      job_id: id,
      ...validationResult.data,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('GET /api/jobs/[id]/applications error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch job applications',
      },
      { status: 500 }
    );
  }
}

// POST /api/jobs/[id]/applications - Create a job application
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
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Sanitize user input
    if (body.cover_letter) {
      body.cover_letter = sanitizeJobDescription(body.cover_letter);
    }

    // Validate request body
    const validationResult = createJobApplicationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors:
            validationResult.error.errors?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const application = await jobService.createJobApplication(
      {
        job_id: id,
        ...validationResult.data,
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      application,
      message: 'Job application submitted successfully',
    });
  } catch (error) {
    console.error('POST /api/jobs/[id]/applications error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create job application',
      },
      { status: 500 }
    );
  }
}
