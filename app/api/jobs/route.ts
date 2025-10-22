import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/server';
import { jobCreationRateLimiter, applyRateLimit } from '@/lib/rate-limiting';
import {
  sanitizeJobDescription,
  sanitizeSpecialRequirements,
} from '@/lib/security/sanitization';
import { z } from 'zod';

const jobService = new JobService();

// Validation schemas
const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description too long'),
  job_type: z.enum(['event_manager', 'contractor_internal']),
  service_category: z.string().min(1, 'Service category is required'),
  budget_range_min: z.number().min(0).optional(),
  budget_range_max: z.number().min(0).optional(),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(200, 'Location too long'),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  is_remote: z.boolean().default(false),
  special_requirements: z
    .string()
    .max(2000, 'Special requirements too long')
    .optional(),
  contact_email: z.string().email('Invalid email').optional(),
  contact_phone: z.string().max(50, 'Phone number too long').optional(),
  response_preferences: z.enum(['email', 'phone', 'platform']).optional(),
  timeline_start_date: z.string().optional(),
  timeline_end_date: z.string().optional(),
  event_id: z.string().uuid().optional(),
});

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
});

// GET /api/jobs - Get jobs with filtering
export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Convert string parameters to appropriate types
    const processedParams = {
      ...queryParams,
      page: queryParams.page ? parseInt(queryParams.page) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      budget_min: queryParams.budget_min
        ? parseFloat(queryParams.budget_min)
        : undefined,
      budget_max: queryParams.budget_max
        ? parseFloat(queryParams.budget_max)
        : undefined,
      is_remote: queryParams.is_remote
        ? queryParams.is_remote === 'true'
        : undefined,
    };

    const validationResult = getJobsSchema.safeParse(processedParams);
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

    const result = await jobService.getJobs(validationResult.data);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('GET /api/jobs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
      },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for job creation (disabled in test environment)
    if (process.env.NODE_ENV !== 'test') {
      const rateLimitResult = await applyRateLimit(
        request,
        jobCreationRateLimiter
      );
      if (!rateLimitResult.allowed) {
        return rateLimitResult.response!;
      }
    }

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

    // Parse request body
    const body = await request.json();

    // Sanitize user input
    if (body.description) {
      body.description = sanitizeJobDescription(body.description);
    }
    if (body.special_requirements) {
      body.special_requirements = sanitizeSpecialRequirements(
        body.special_requirements
      );
    }

    // Validate request body
    const validationResult = createJobSchema.safeParse(body);
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

    const job = await jobService.createJob(validationResult.data, user.id);

    return NextResponse.json({
      success: true,
      job,
      message: 'Job created successfully',
    });
  } catch (error) {
    console.error('POST /api/jobs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create job',
      },
      { status: 500 }
    );
  }
}
