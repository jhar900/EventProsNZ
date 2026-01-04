import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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
  try {
    console.log('[POST /api/user/create-job-application] Route handler called');

    // Get user ID from request headers
    const userId = request.headers.get('x-user-id');
    console.log(
      '[POST /api/user/create-job-application] User ID from header:',
      userId
    );

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Verify user exists
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Get business profile ID for the user (contractor_id references business_profiles.id)
    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (businessProfileError || !businessProfile) {
      console.error(
        '[POST /api/user/create-job-application] Business profile error:',
        businessProfileError
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'Business profile not found. Please complete your business profile setup first.',
        },
        { status: 400 }
      );
    }

    const contractorId = businessProfile.id;
    console.log(
      '[POST /api/user/create-job-application] Using contractor_id (business_profile.id):',
      contractorId
    );

    // Parse and validate request body
    const body = await request.json();
    console.log('[POST /api/user/create-job-application] Request body:', {
      job_id: body.job_id,
      hasApplicationMessage: !!body.application_message,
      hasProposedBudget: body.proposed_budget !== undefined,
      attachmentsCount: body.attachments?.length || 0,
    });

    const validationResult = createJobApplicationSchema.safeParse(body);
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

    // Directly insert into database
    const { data: application, error: insertError } = await supabaseAdmin
      .from('job_applications')
      .insert({
        job_id: validationResult.data.job_id,
        contractor_id: contractorId, // Use business_profile.id, not user.id
        application_message: validationResult.data.application_message,
        proposed_budget: validationResult.data.proposed_budget ?? null,
        attachments: validationResult.data.attachments || [],
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        '[POST /api/user/create-job-application] Database error:',
        insertError
      );
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      );
    }

    console.log(
      '[POST /api/user/create-job-application] Application created successfully:',
      application.id
    );

    return NextResponse.json({
      success: true,
      application,
      message: 'Job application submitted successfully',
    });
  } catch (error) {
    console.error('[POST /api/user/create-job-application] Error:', error);
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
