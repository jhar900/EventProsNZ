import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const jobService = new JobService();

// Validation schema for internal job creation
const createInternalJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description too long'),
  internal_job_category: z.enum([
    'casual_work',
    'subcontracting',
    'partnerships',
  ]),
  service_category: z.string().min(1, 'Service category is required'),
  skill_requirements: z
    .array(z.string())
    .min(1, 'At least one skill is required'),
  experience_level: z.enum(['entry', 'intermediate', 'senior', 'expert']),
  budget_range_min: z.number().min(0).optional(),
  budget_range_max: z.number().min(0).optional(),
  payment_terms: z.string().min(1, 'Payment terms are required'),
  work_arrangement: z.enum(['remote', 'onsite', 'hybrid']),
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
});

// Validation schema for internal job updates
const updateInternalJobSchema = createInternalJobSchema.partial();

// Validation schema for internal job filters
const getInternalJobsSchema = z.object({
  internal_job_category: z
    .array(z.enum(['casual_work', 'subcontracting', 'partnerships']))
    .optional(),
  service_category: z.array(z.string()).optional(),
  experience_level: z
    .array(z.enum(['entry', 'intermediate', 'senior', 'expert']))
    .optional(),
  work_arrangement: z.array(z.enum(['remote', 'onsite', 'hybrid'])).optional(),
  skills: z.array(z.string()).optional(),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  location: z.string().optional(),
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

// POST /api/jobs/internal - Create internal job posting
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = createInternalJobSchema.parse(body);

    // Verify user is a contractor (you might want to add additional verification)
    const { data: userProfile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.user_type !== 'contractor') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only contractors can post internal jobs',
        },
        { status: 403 }
      );
    }

    // Create the job with internal job specific fields
    const jobData = {
      ...validatedData,
      job_type: 'contractor_internal' as const,
      status: 'active' as const,
    };

    const job = await jobService.createJob(jobData, user.id);

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('POST /api/jobs/internal error:', error);
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
            : 'Failed to create internal job',
      },
      { status: 500 }
    );
  }
}

// GET /api/jobs/internal - Get internal jobs with filtering
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
    const parsedParams = getInternalJobsSchema.parse({
      ...params,
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 20,
      budget_min: params.budget_min ? parseFloat(params.budget_min) : undefined,
      budget_max: params.budget_max ? parseFloat(params.budget_max) : undefined,
      is_remote: params.is_remote ? params.is_remote === 'true' : undefined,
      internal_job_category: params.internal_job_category
        ? params.internal_job_category.split(',')
        : undefined,
      service_category: params.service_category
        ? params.service_category.split(',')
        : undefined,
      experience_level: params.experience_level
        ? params.experience_level.split(',')
        : undefined,
      work_arrangement: params.work_arrangement
        ? params.work_arrangement.split(',')
        : undefined,
      skills: params.skills ? params.skills.split(',') : undefined,
    });

    // Build query for internal jobs
    let query = supabase
      .from('jobs')
      .select(
        `
        *,
        posted_by_user:users!jobs_posted_by_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          company_name,
          profile_photo_url
        )
      `,
        { count: 'exact' }
      )
      .eq('job_type', 'contractor_internal');

    // Apply filters
    if (
      parsedParams.internal_job_category &&
      parsedParams.internal_job_category.length > 0
    ) {
      query = query.in(
        'internal_job_category',
        parsedParams.internal_job_category
      );
    }
    if (
      parsedParams.service_category &&
      parsedParams.service_category.length > 0
    ) {
      query = query.in('service_category', parsedParams.service_category);
    }
    if (
      parsedParams.experience_level &&
      parsedParams.experience_level.length > 0
    ) {
      query = query.in('experience_level', parsedParams.experience_level);
    }
    if (
      parsedParams.work_arrangement &&
      parsedParams.work_arrangement.length > 0
    ) {
      query = query.in('work_arrangement', parsedParams.work_arrangement);
    }
    if (parsedParams.skills && parsedParams.skills.length > 0) {
      // This would need a more sophisticated search for skills
      // For now, we'll do a simple text search
      const skillsQuery = parsedParams.skills
        .map(skill => `skill_requirements.ilike.%${skill}%`)
        .join(',');
      query = query.or(skillsQuery);
    }
    if (parsedParams.budget_min !== undefined) {
      query = query.gte('budget_range_min', parsedParams.budget_min);
    }
    if (parsedParams.budget_max !== undefined) {
      query = query.lte('budget_range_max', parsedParams.budget_max);
    }
    if (parsedParams.location) {
      query = query.ilike('location', `%${parsedParams.location}%`);
    }
    if (parsedParams.is_remote !== undefined) {
      query = query.eq('is_remote', parsedParams.is_remote);
    }
    if (parsedParams.status) {
      query = query.eq('status', parsedParams.status);
    }
    if (parsedParams.posted_by_user_id) {
      query = query.eq('posted_by_user_id', parsedParams.posted_by_user_id);
    }

    // Apply text search
    if (parsedParams.q) {
      query = query.or(
        `title.ilike.%${parsedParams.q}%,description.ilike.%${parsedParams.q}%,location.ilike.%${parsedParams.q}%`
      );
    }

    // Apply sorting
    query = query.order(parsedParams.sort_by, {
      ascending: parsedParams.sort_order === 'asc',
    });

    // Apply pagination
    const offset = (parsedParams.page - 1) * parsedParams.limit;
    query = query.range(offset, offset + parsedParams.limit - 1);

    const { data: jobs, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch internal jobs: ${error.message}`);
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / parsedParams.limit);

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
      total,
      page: parsedParams.page,
      limit: parsedParams.limit,
      total_pages,
    });
  } catch (error) {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('GET /api/jobs/internal error:', error);
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
            : 'Failed to fetch internal jobs',
      },
      { status: 500 }
    );
  }
}
