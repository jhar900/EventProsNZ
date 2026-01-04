import { NextRequest, NextResponse } from 'next/server';
import { JobService } from '@/lib/jobs/job-service';
import { createClient } from '@/lib/supabase/middleware';
import { sanitizeJobDescription } from '@/lib/security/sanitization';
import { checkSuspensionAndBlock } from '@/lib/middleware/suspension-middleware';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Lazy initialization to avoid top-level side effects
let jobService: JobService | null = null;
const getJobService = () => {
  if (!jobService) {
    jobService = new JobService();
  }
  return jobService;
};

// Validation schemas
const createJobApplicationSchema = z.object({
  application_message: z
    .string()
    .min(1, 'Application message is required')
    .max(2000, 'Application message too long'),
  proposed_budget: z.number().min(0).optional(),
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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // CRITICAL: This log should appear in terminal if route is working
  console.error('=== GET /api/jobs/[id]/applications ROUTE HANDLER CALLED ===');
  console.error('Request URL:', request.url);

  // Return immediately to test if route is registered
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    console.error('Resolved params:', resolvedParams);

    // Return a simple test response first
    return NextResponse.json({
      success: true,
      message: 'Route is working',
      jobId: resolvedParams.id,
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: 'Route error' }, { status: 500 });
  }
}

// POST /api/jobs/[id]/applications - Create a job application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  console.log('[POST /api/jobs/[id]/applications] Route handler called');
  console.log('[POST /api/jobs/[id]/applications] Request URL:', request.url);
  console.log('[POST /api/jobs/[id]/applications] Params type:', typeof params);

  try {
    // Handle params being a Promise (Next.js 15)
    const resolvedParams = params instanceof Promise ? await params : params;
    console.log(
      '[POST /api/jobs/[id]/applications] Resolved params:',
      resolvedParams
    );

    const { supabase } = createClient(request);
    console.log('[POST /api/jobs/[id]/applications] Supabase client created');

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

    // Check suspension status
    const suspensionResponse = await checkSuspensionAndBlock(
      request,
      user.id,
      supabase
    );
    if (suspensionResponse) {
      return suspensionResponse;
    }

    const { id } = resolvedParams;
    console.log('[POST /api/jobs/[id]/applications] Job ID:', id);

    if (!id) {
      console.error('[POST /api/jobs/[id]/applications] No job ID in params');
      return NextResponse.json(
        { success: false, error: 'Job ID is required', params: resolvedParams },
        { status: 400 }
      );
    }

    // Parse request body
    console.log('[POST /api/jobs/[id]/applications] Parsing request body...');
    const body = await request.json();
    console.log('[POST /api/jobs/[id]/applications] Request body:', {
      hasApplicationMessage: !!body.application_message,
      hasProposedBudget: body.proposed_budget !== undefined,
      attachmentsCount: body.attachments?.length || 0,
    });

    // Sanitize user input
    if (body.application_message) {
      body.application_message = sanitizeJobDescription(
        body.application_message
      );
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

    console.log(
      '[POST /api/jobs/[id]/applications] Creating job application...'
    );
    const application = await getJobService().createJobApplication(
      {
        job_id: id,
        ...validationResult.data,
      },
      user.id
    );

    console.log(
      '[POST /api/jobs/[id]/applications] Application created successfully:',
      application.id
    );
    return NextResponse.json({
      success: true,
      application,
      message: 'Job application submitted successfully',
    });
  } catch (error) {
    console.error('[POST /api/jobs/[id]/applications] Error:', error);
    console.error(
      '[POST /api/jobs/[id]/applications] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create job application',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
