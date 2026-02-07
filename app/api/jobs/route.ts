import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const jobService = new JobService();

// Validation schema for creating a job
const createJobSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(5000, 'Description too long'),
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
    contact_person_id: z.string().uuid().optional(),
    response_preferences: z.enum(['email', 'phone', 'platform']).optional(),
    timeline_start_date: z.string().optional(),
    timeline_end_date: z.string().optional(),
    event_id: z.string().uuid().optional(),
  })
  .refine(
    data => {
      // If both dates are provided, start date must be before or equal to end date
      if (data.timeline_start_date && data.timeline_end_date) {
        const startDate = new Date(data.timeline_start_date);
        const endDate = new Date(data.timeline_end_date);
        return startDate <= endDate;
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['timeline_end_date'],
    }
  )
  .refine(
    data => {
      // If both budget values are provided, min must be less than or equal to max
      if (
        data.budget_range_min !== undefined &&
        data.budget_range_max !== undefined
      ) {
        return data.budget_range_min <= data.budget_range_max;
      }
      return true;
    },
    {
      message: 'Minimum budget must be less than or equal to maximum budget',
      path: ['budget_range_max'],
    }
  );

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
    // Use middleware client for better cookie handling (non-blocking auth check)
    const { createClient } = await import('@/lib/supabase/middleware');
    const { supabase } = createClient(request);

    // Get current user (optional for public job listings) - don't block on this
    const userPromise = supabase.auth
      .getUser()
      .catch(() => ({ data: { user: null }, error: null }));

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

    // Fetch jobs in parallel with auth check (don't wait for auth)
    const [result] = await Promise.all([
      parsedParams.q
        ? jobService.searchJobs(parsedParams)
        : jobService.getJobs(parsedParams),
      userPromise, // Resolve auth check but don't block
    ]);

    // Add cache headers - jobs list can be cached for a short time
    const response = NextResponse.json({
      success: true,
      ...result,
    });

    // For user's own jobs (posted_by_user_id), use shorter cache since they change more frequently
    // For public job listings, use longer cache
    if (parsedParams.posted_by_user_id) {
      // User's own jobs - cache for 15 seconds, stale-while-revalidate for 10 seconds
      response.headers.set(
        'Cache-Control',
        'private, max-age=15, stale-while-revalidate=10'
      );
    } else {
      // Public jobs - cache for 30 seconds, stale-while-revalidate for 15 seconds
      response.headers.set(
        'Cache-Control',
        'public, max-age=30, stale-while-revalidate=15'
      );
    }

    return response;
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

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    // Try to get user ID from header first (sent by client)
    let userId = request.headers.get('x-user-id');
    console.log('User ID from header:', userId);

    let supabase;
    let user;

    if (userId) {
      console.log('Using service role client with userId from header');
      // Use service role client if we have user ID from header
      supabase = supabaseAdmin;
      // Verify user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single();

      console.log('User verification result:', { userData, userError });

      if (userError || !userData) {
        console.error('User verification failed:', userError);
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
            error: userError?.message || 'User not found',
          },
          { status: 401 }
        );
      }
      user = { id: userId, role: userData.role };
    } else {
      console.log('Using middleware client for cookie-based auth');
      // Fallback to middleware client for cookie-based auth
      const { createClient: createMiddlewareClient } = await import(
        '@/lib/supabase/middleware'
      );
      const { supabase: middlewareSupabase } = createMiddlewareClient(request);

      // Try getSession first (doesn't auto-refresh, safer)
      const {
        data: { session },
        error: sessionError,
      } = await middlewareSupabase.auth.getSession();

      let authUser = session?.user;

      // If no session, try getUser (but handle refresh token errors)
      if (!authUser) {
        const {
          data: { user: getUserUser },
          error: authError,
        } = await middlewareSupabase.auth.getUser();

        // Handle refresh token errors gracefully
        if (authError) {
          if (
            authError.message?.includes('refresh_token_not_found') ||
            authError.message?.includes('Invalid Refresh Token') ||
            authError.message?.includes('Refresh Token Not Found')
          ) {
            console.warn(
              'Refresh token invalid, user may need to re-authenticate'
            );
            return NextResponse.json(
              {
                success: false,
                message: 'Session expired. Please log in again.',
                error: 'Session expired. Please log in again.',
                code: 'SESSION_EXPIRED',
              },
              { status: 401 }
            );
          }
          console.error('Auth failed:', authError);
          return NextResponse.json(
            {
              success: false,
              message: 'Unauthorized',
              error: authError.message || 'Auth session missing!',
            },
            { status: 401 }
          );
        }

        authUser = getUserUser;
      }

      if (!authUser) {
        console.error('No user found in POST /api/jobs');
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized',
            error: 'No user found',
          },
          { status: 401 }
        );
      }

      supabase = middlewareSupabase;
      user = authUser;
      userId = authUser.id;
    }

    console.log('Authentication successful, userId:', userId);

    if (!user) {
      console.error('No user found in POST /api/jobs');
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'No user found' },
        { status: 401 }
      );
    }

    // Get user's role (if not already retrieved from header)
    let userRole: string;
    if ((user as any).role) {
      // Role already retrieved when verifying user from header
      userRole = (user as any).role;
    } else {
      // Need to fetch role from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user role:', userError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to get user information',
            details: userError.message,
          },
          { status: 500 }
        );
      }

      if (!userData) {
        console.error('No user data found for user ID:', user.id);
        return NextResponse.json(
          {
            success: false,
            error: 'User not found in database',
          },
          { status: 404 }
        );
      }

      userRole = userData.role;
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createJobSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Automatically set job_type based on user's role
    let jobType: 'event_manager' | 'contractor_internal';
    if (userRole === 'contractor') {
      jobType = 'contractor_internal';
    } else if (userRole === 'event_manager') {
      jobType = 'event_manager';
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Only event managers and contractors can create jobs',
        },
        { status: 403 }
      );
    }

    // Create job with automatically set job_type
    // Only include fields with actual values (not undefined, null, or empty string)
    const jobData: any = {
      title: validationResult.data.title,
      description: validationResult.data.description,
      service_category: validationResult.data.service_category,
      location: validationResult.data.location,
      is_remote: validationResult.data.is_remote,
      job_type: jobType,
    };

    // Only add optional fields if they have meaningful values
    if (typeof validationResult.data.budget_range_min === 'number') {
      jobData.budget_range_min = validationResult.data.budget_range_min;
    }
    if (typeof validationResult.data.budget_range_max === 'number') {
      jobData.budget_range_max = validationResult.data.budget_range_max;
    }
    if (
      validationResult.data.coordinates &&
      typeof validationResult.data.coordinates === 'object'
    ) {
      jobData.coordinates = validationResult.data.coordinates;
    }
    if (
      validationResult.data.special_requirements &&
      validationResult.data.special_requirements.trim()
    ) {
      jobData.special_requirements = validationResult.data.special_requirements;
    }
    if (
      validationResult.data.contact_email &&
      validationResult.data.contact_email.trim()
    ) {
      jobData.contact_email = validationResult.data.contact_email;
    }
    if (
      validationResult.data.contact_phone &&
      validationResult.data.contact_phone.trim()
    ) {
      jobData.contact_phone = validationResult.data.contact_phone;
    }
    if (
      validationResult.data.contact_person_id &&
      validationResult.data.contact_person_id.trim()
    ) {
      jobData.contact_person_id = validationResult.data.contact_person_id;
    }
    if (validationResult.data.response_preferences) {
      jobData.response_preferences = validationResult.data.response_preferences;
    }
    if (
      validationResult.data.timeline_start_date &&
      validationResult.data.timeline_start_date.trim()
    ) {
      jobData.timeline_start_date = validationResult.data.timeline_start_date;
    }
    if (
      validationResult.data.timeline_end_date &&
      validationResult.data.timeline_end_date.trim()
    ) {
      jobData.timeline_end_date = validationResult.data.timeline_end_date;
    }
    if (
      validationResult.data.event_id &&
      validationResult.data.event_id.trim()
    ) {
      jobData.event_id = validationResult.data.event_id;
    }

    const job = await jobService.createJob(jobData, user.id);

    return NextResponse.json({
      success: true,
      job,
      message: 'Job created successfully',
    });
  } catch (error) {
    console.error('POST /api/jobs error:', error);

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
        error: error instanceof Error ? error.message : 'Failed to create job',
      },
      { status: 500 }
    );
  }
}
