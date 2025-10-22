import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const jobService = new JobService();

// Validation schema for internal job updates
const updateInternalJobSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description too long')
    .optional(),
  internal_job_category: z
    .enum(['casual_work', 'subcontracting', 'partnerships'])
    .optional(),
  service_category: z
    .string()
    .min(1, 'Service category is required')
    .optional(),
  skill_requirements: z
    .array(z.string())
    .min(1, 'At least one skill is required')
    .optional(),
  experience_level: z
    .enum(['entry', 'intermediate', 'senior', 'expert'])
    .optional(),
  budget_range_min: z.number().min(0).optional(),
  budget_range_max: z.number().min(0).optional(),
  payment_terms: z.string().min(1, 'Payment terms are required').optional(),
  work_arrangement: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(200, 'Location too long')
    .optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  is_remote: z.boolean().optional(),
  special_requirements: z
    .string()
    .max(2000, 'Special requirements too long')
    .optional(),
  contact_email: z.string().email('Invalid email').optional(),
  contact_phone: z.string().max(50, 'Phone number too long').optional(),
  response_preferences: z.enum(['email', 'phone', 'platform']).optional(),
  timeline_start_date: z.string().optional(),
  timeline_end_date: z.string().optional(),
  status: z.enum(['active', 'filled', 'completed', 'cancelled']).optional(),
});

// GET /api/jobs/internal/[id] - Get internal job details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Get current user (optional for public job details)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const jobId = params.id;

    // Get job details
    const job = await jobService.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Internal job not found',
        },
        { status: 404 }
      );
    }

    // Verify this is an internal job
    if (job.job_type !== 'contractor_internal') {
      return NextResponse.json(
        {
          success: false,
          error: 'This is not an internal job',
        },
        { status: 400 }
      );
    }

    // Track view if user is authenticated
    if (user) {
      await jobService.trackJobView(
        jobId,
        user.id,
        request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
        request.headers.get('user-agent'),
        request.headers.get('referer')
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('GET /api/jobs/internal/[id] error:', error);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch internal job',
      },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/internal/[id] - Update internal job
export async function PUT(
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
    const validatedData = updateInternalJobSchema.parse(body);

    // Verify this is an internal job and user owns it
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('job_type, posted_by_user_id')
      .eq('id', jobId)
      .single();

    if (fetchError || !existingJob) {
      return NextResponse.json(
        {
          success: false,
          error: 'Internal job not found',
        },
        { status: 404 }
      );
    }

    if (existingJob.job_type !== 'contractor_internal') {
      return NextResponse.json(
        {
          success: false,
          error: 'This is not an internal job',
        },
        { status: 400 }
      );
    }

    if (existingJob.posted_by_user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to update this internal job',
        },
        { status: 403 }
      );
    }

    // Update the job
    const job = await jobService.updateJob(jobId, validatedData, user.id);

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('PUT /api/jobs/internal/[id] error:', error);
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
            : 'Failed to update internal job',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/internal/[id] - Delete internal job
export async function DELETE(
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

    // Verify this is an internal job and user owns it
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('job_type, posted_by_user_id')
      .eq('id', jobId)
      .single();

    if (fetchError || !existingJob) {
      return NextResponse.json(
        {
          success: false,
          error: 'Internal job not found',
        },
        { status: 404 }
      );
    }

    if (existingJob.job_type !== 'contractor_internal') {
      return NextResponse.json(
        {
          success: false,
          error: 'This is not an internal job',
        },
        { status: 400 }
      );
    }

    if (existingJob.posted_by_user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to delete this internal job',
        },
        { status: 403 }
      );
    }

    // Delete the job
    await jobService.deleteJob(jobId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Internal job deleted successfully',
    });
  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('DELETE /api/jobs/internal/[id] error:', error);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete internal job',
      },
      { status: 500 }
    );
  }
}
