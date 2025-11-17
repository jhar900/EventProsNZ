import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const step1Schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  address: z.string().min(5, 'Address is required'),
  profile_photo_url: z.string().url().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client) - same approach as profile settings
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
    const validatedData = step1Schema.parse(body);

    // Check if user already has a profile
    const { data: existingProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId);

    // Handle case where there might be multiple profiles (shouldn't happen, but handle it)
    if (checkError) {
      console.error('Error checking for existing profile:', checkError);
      return NextResponse.json(
        {
          error: 'Failed to check existing profile',
          details: checkError.message,
        },
        { status: 500 }
      );
    }

    const existingProfile =
      existingProfiles && existingProfiles.length > 0
        ? existingProfiles[0]
        : null;

    if (existingProfile) {
      // Update existing profile
      const updateData: any = {
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        phone: validatedData.phone,
        address: validatedData.address,
        updated_at: new Date().toISOString(),
      };

      if (
        validatedData.profile_photo_url &&
        validatedData.profile_photo_url.trim() !== ''
      ) {
        updateData.avatar_url = validatedData.profile_photo_url;
      }

      // Update the first profile found (or all if there are duplicates)
      const { data: updatedProfiles, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update profile',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      // Get the updated profile (first one if multiple)
      const profile =
        updatedProfiles && updatedProfiles.length > 0
          ? updatedProfiles[0]
          : existingProfile;

      // Update onboarding status - preserve existing step completions
      const { data: existingStatus, error: statusFetchError } = await supabase
        .from('contractor_onboarding_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Step1 API - Existing status:', existingStatus);
      console.log('Step1 API - Status fetch error:', statusFetchError);

      const updatedStatus = {
        user_id: userId,
        step1_completed: true,
        step2_completed: existingStatus?.step2_completed ?? false,
        step3_completed: existingStatus?.step3_completed ?? false,
        step4_completed: existingStatus?.step4_completed ?? false,
        is_submitted: existingStatus?.is_submitted ?? false,
        approval_status: existingStatus?.approval_status ?? 'pending',
      };

      console.log('Step1 API - Updating status with:', updatedStatus);

      const { data: updatedStatusData, error: statusUpdateError } =
        await supabase
          .from('contractor_onboarding_status')
          .upsert(updatedStatus, {
            onConflict: 'user_id', // Specify conflict resolution column
          })
          .select();

      console.log('Step1 API - Status update result:', updatedStatusData);
      console.log('Step1 API - Status update error:', statusUpdateError);

      return NextResponse.json({
        success: true,
        profile,
        message: 'Profile updated successfully',
      });
    } else {
      // Create new profile
      const insertData: any = {
        user_id: userId,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        phone: validatedData.phone,
        address: validatedData.address,
        timezone: 'Pacific/Auckland', // Default to NZ timezone
      };

      if (
        validatedData.profile_photo_url &&
        validatedData.profile_photo_url.trim() !== ''
      ) {
        insertData.avatar_url = validatedData.profile_photo_url;
      }

      const { data: profile, error: createError } = await supabase
        .from('profiles')
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json(
          {
            error: 'Failed to create profile',
            details: createError.message,
          },
          { status: 500 }
        );
      }

      // Create onboarding status - check if one already exists first
      const { data: existingStatusForInsert } = await supabase
        .from('contractor_onboarding_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      await supabase.from('contractor_onboarding_status').upsert(
        {
          user_id: userId,
          step1_completed: true,
          step2_completed: existingStatusForInsert?.step2_completed ?? false,
          step3_completed: existingStatusForInsert?.step3_completed ?? false,
          step4_completed: existingStatusForInsert?.step4_completed ?? false,
          is_submitted: existingStatusForInsert?.is_submitted ?? false,
          approval_status:
            existingStatusForInsert?.approval_status ?? 'pending',
        },
        {
          onConflict: 'user_id', // Specify conflict resolution column
        }
      );

      return NextResponse.json({
        success: true,
        profile,
        message: 'Profile created successfully',
      });
    }
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
