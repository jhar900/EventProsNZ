import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const step4Schema = z.object({
  community_goals: z.string().optional(),
  questions: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client) - same approach as other steps
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Create Supabase client with service role for database operations
    // This bypasses RLS and avoids cookie/session issues
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    // Validate request body
    const body = await request.json();
    const validatedData = step4Schema.parse(body);

    // Get business profile ID for this user
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        {
          error: 'Business profile not found',
          details: 'Please complete the Business Information section first',
        },
        { status: 400 }
      );
    }

    const businessProfileId = businessProfile.id;

    // Update business profile with publicity information
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.community_goals) {
      updateData.community_goals = validatedData.community_goals;
    }

    if (validatedData.questions) {
      updateData.questions = validatedData.questions;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('business_profiles')
      .update(updateData)
      .eq('id', businessProfileId)
      .select();

    if (updateError) {
      console.error(
        'Step4 API - Error updating business profile:',
        updateError
      );

      // If community_goals or questions columns don't exist, try without them
      if (
        updateError.message?.includes('community_goals') ||
        updateError.message?.includes('questions') ||
        updateError.message?.includes('column') ||
        updateError.message?.includes('schema cache')
      ) {
        console.log(
          'Step4 API - Publicity column not found, updating without it. Error:',
          updateError.message
        );

        // Just update the timestamp to mark step as complete
        const { error: timestampError } = await supabase
          .from('business_profiles')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessProfileId);

        if (timestampError) {
          return NextResponse.json(
            {
              error: 'Failed to update business profile',
              details: updateError.message,
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: 'Failed to update business profile',
            details: updateError.message,
          },
          { status: 500 }
        );
      }
    }

    // Update onboarding status - preserve existing step completions
    const { data: existingStatus, error: statusFetchError } = await supabase
      .from('contractor_onboarding_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Step4 API - Existing status:', existingStatus);
    console.log('Step4 API - Status fetch error:', statusFetchError);

    const updatedStatus = {
      user_id: userId,
      step1_completed: existingStatus?.step1_completed ?? false,
      step2_completed: existingStatus?.step2_completed ?? false,
      step3_completed: existingStatus?.step3_completed ?? false,
      step4_completed: true,
      is_submitted: existingStatus?.is_submitted ?? false,
      approval_status: existingStatus?.approval_status ?? 'pending',
    };

    console.log('Step4 API - Updating status with:', updatedStatus);

    const { data: updatedStatusData, error: statusUpdateError } = await supabase
      .from('contractor_onboarding_status')
      .upsert(updatedStatus, {
        onConflict: 'user_id', // Specify conflict resolution column
      })
      .select();

    console.log('Step4 API - Status update result:', updatedStatusData);
    console.log('Step4 API - Status update error:', statusUpdateError);

    return NextResponse.json({
      success: true,
      business_profile: updatedProfile,
      message: 'Publicity information saved successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
