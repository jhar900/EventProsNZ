import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const jobService = new JobService();

// Helper to convert empty strings to undefined
const emptyToUndefined = (val: unknown) =>
  val === '' || val === null ? undefined : val;

// Validation schemas
const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  service_category: z.preprocess(emptyToUndefined, z.string().optional()),
  budget_type: z.preprocess(
    emptyToUndefined,
    z.enum(['range', 'fixed', 'open', 'hourly', 'daily']).optional()
  ),
  budget_range_min: z.preprocess(
    emptyToUndefined,
    z.number().min(0).optional()
  ),
  budget_range_max: z.preprocess(
    emptyToUndefined,
    z.number().min(0).optional()
  ),
  budget_fixed: z.preprocess(emptyToUndefined, z.number().min(0).optional()),
  hourly_rate: z.preprocess(emptyToUndefined, z.number().min(0).optional()),
  daily_rate: z.preprocess(emptyToUndefined, z.number().min(0).optional()),
  location: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  coordinates: z.preprocess(
    emptyToUndefined,
    z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional()
  ),
  is_remote: z.boolean().optional(),
  special_requirements: z.preprocess(
    emptyToUndefined,
    z.string().max(2000).optional()
  ),
  contact_email: z.preprocess(
    emptyToUndefined,
    z.string().email().max(255).optional()
  ),
  contact_phone: z.preprocess(emptyToUndefined, z.string().max(50).optional()),
  contact_person_id: z.preprocess(
    emptyToUndefined,
    z.string().uuid().optional()
  ),
  response_preferences: z.preprocess(
    emptyToUndefined,
    z.enum(['email', 'phone', 'platform']).optional()
  ),
  timeline_start_date: z.preprocess(emptyToUndefined, z.string().optional()),
  timeline_end_date: z.preprocess(emptyToUndefined, z.string().optional()),
  event_id: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  status: z.enum(['active', 'filled', 'completed', 'cancelled']).optional(),
});

// GET /api/jobs/[id] - Get a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = createClient(request);

    // Get current user (optional for public job viewing)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const job = await jobService.getJob(id);

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Track job view if user is authenticated
    if (user) {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : request.ip;
      const userAgent = request.headers.get('user-agent');
      const referrer = request.headers.get('referer');

      await jobService.trackJobView(
        id,
        user.id,
        ip,
        userAgent || undefined,
        referrer || undefined
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('GET /api/jobs/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job',
      },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try cookie-based auth first
    const { supabase } = createClient(request);
    let userId: string | null = null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
    } else {
      // Fallback to header-based auth
      const headerUserId = request.headers.get('x-user-id');
      if (headerUserId) {
        const { data: userData, error: userError } =
          await supabaseAdmin.auth.admin.getUserById(headerUserId);
        if (!userError && userData) {
          userId = headerUserId;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = updateJobSchema.safeParse(body);
    if (!validationResult.success) {
      console.error(
        'Job update validation failed:',
        validationResult.error.issues
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request data',
          errors:
            validationResult.error.issues?.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const job = await jobService.updateJob(id, validationResult.data, userId);

    return NextResponse.json({
      success: true,
      job,
      message: 'Job updated successfully',
    });
  } catch (error) {
    console.error('PUT /api/jobs/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update job',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try cookie-based auth first
    const { supabase } = createClient(request);
    let userId: string | null = null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
    } else {
      // Fallback to header-based auth
      const headerUserId = request.headers.get('x-user-id');
      if (headerUserId) {
        const { data: userData, error: userError } =
          await supabaseAdmin.auth.admin.getUserById(headerUserId);
        if (!userError && userData) {
          userId = headerUserId;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    await jobService.deleteJob(id, userId);

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/jobs/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete job',
      },
      { status: 500 }
    );
  }
}
