import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { JobService } from '@/lib/jobs/job-service';
import { sanitizeJobDescription } from '@/lib/security/sanitization';
import { checkSuspensionAndBlock } from '@/lib/middleware/suspension-middleware';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema (safe to define at module scope - no side effects)
const createJobApplicationSchema = z.object({
  job_id: z.string().uuid(),
  application_message: z
    .string()
    .min(1, 'Application message is required')
    .max(2000, 'Application message too long'),
  proposed_budget: z.number().min(0).optional(),
  attachments: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  console.log('[POST /api/user/submit-job-application] Route handler called');
  // Lazy initialization: create JobService inside handler to avoid module-level side effects
  const jobService = new JobService();
  console.log(
    '[POST /api/user/submit-job-application] Request URL:',
    request.url
  );

  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    console.log(
      '[POST /api/user/submit-job-application] User ID from header:',
      userId
    );

    if (!userId) {
      console.error(
        '[POST /api/user/submit-job-application] No user ID in header'
      );
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    console.log(
      '[POST /api/user/submit-job-application] Received job application submission:',
      userId
    );

    // Use supabaseAdmin to verify user exists
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Check suspension status using supabaseAdmin
    const suspensionResponse = await checkSuspensionAndBlock(
      request,
      userId,
      supabaseAdmin
    );
    if (suspensionResponse) {
      return suspensionResponse;
    }

    // Parse request body
    console.log(
      '[POST /api/user/submit-job-application] Parsing request body...'
    );
    const body = await request.json();
    console.log('[POST /api/user/submit-job-application] Request body:', {
      job_id: body.job_id,
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
      '[POST /api/user/submit-job-application] Creating job application...'
    );
    const application = await jobService.createJobApplication(
      validationResult.data,
      userId
    );

    console.log(
      '[POST /api/user/submit-job-application] Application created successfully:',
      application.id
    );
    return NextResponse.json({
      success: true,
      application,
      message: 'Job application submitted successfully',
    });
  } catch (error) {
    console.error('[POST /api/user/submit-job-application] Error:', error);
    console.error(
      '[POST /api/user/submit-job-application] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
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
