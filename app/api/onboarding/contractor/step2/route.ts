import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const step2Schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  business_address: z.string().min(5, 'Business address is required'),
  nzbn: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  service_areas: z
    .array(z.string())
    .min(1, 'At least one service area is required'),
  service_categories: z
    .array(z.string())
    .min(1, 'At least one service category is required'),
  logo_url: z.string().url().optional().or(z.literal('')),
  social_links: z
    .object({
      website: z.string().url().optional().or(z.literal('')),
      facebook: z.string().url().optional().or(z.literal('')),
      instagram: z.string().url().optional().or(z.literal('')),
      linkedin: z.string().url().optional().or(z.literal('')),
      twitter: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
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
    console.log('Step2 API received data:', body);

    let validatedData;
    try {
      validatedData = step2Schema.parse(body);
      console.log('Step2 API validation successful:', validatedData);
    } catch (validationError) {
      console.error('Step2 API validation error:', validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation error',
            details: validationError.errors
              .map(e => `${e.path.join('.')}: ${e.message}`)
              .join(', '),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if user already has a business profile
    const { data: existingBusinessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingBusinessProfile) {
      // Update existing business profile
      // Clean up social_links - remove empty strings and convert to null if all empty
      const socialLinks = validatedData.social_links;
      const cleanedSocialLinks = socialLinks
        ? Object.fromEntries(
            Object.entries(socialLinks).map(([key, value]) => [
              key,
              value === '' ? null : value,
            ])
          )
        : null;

      const updateData: any = {
        company_name: validatedData.company_name,
        description: validatedData.description,
        service_areas: validatedData.service_areas,
        service_categories: validatedData.service_categories,
        updated_at: new Date().toISOString(),
        location: validatedData.business_address, // Use location column which definitely exists
      };

      console.log(
        'Step2 API - Updating business profile with service_areas:',
        validatedData.service_areas
      );

      // Try to include business_address if the column exists (migration may not have run)
      // We'll catch the error and retry without it if needed
      try {
        updateData.business_address = validatedData.business_address;
      } catch (e) {
        // Ignore - will just use location
      }

      if (validatedData.nzbn !== undefined) {
        updateData.nzbn = validatedData.nzbn || null;
      }

      if (validatedData.logo_url && validatedData.logo_url.trim() !== '') {
        updateData.logo_url = validatedData.logo_url;
      }

      // Handle social_links - only include if at least one field has a value
      if (cleanedSocialLinks) {
        const hasAnyLink = Object.values(cleanedSocialLinks).some(
          v => v !== null && v !== ''
        );
        if (hasAnyLink) {
          updateData.social_links = cleanedSocialLinks;
        }
        // If no links, don't include social_links in update (leave it as is)
      }

      // Try update with business_address first
      const { data: updatedProfiles, error: updateError } = await supabase
        .from('business_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select();

      console.log('Step2 API - Update result:', {
        success: !updateError,
        error: updateError?.message,
        updatedProfile: updatedProfiles?.[0],
        service_areas_in_result: updatedProfiles?.[0]?.service_areas,
      });

      // Get the first updated profile (or null if none)
      let businessProfile =
        updatedProfiles && updatedProfiles.length > 0
          ? updatedProfiles[0]
          : null;

      // If update fails due to missing columns, retry with only base schema columns
      if (
        updateError &&
        (updateError.message?.includes('business_address') ||
          updateError.message?.includes('nzbn') ||
          updateError.message?.includes('service_areas') ||
          updateError.message?.includes('social_links'))
      ) {
        console.log(
          'Some columns not found, retrying with only base schema columns. Error:',
          updateError.message
        );
        // Use only columns that exist in the base schema
        const updateDataMinimal: any = {
          company_name: validatedData.company_name,
          description: validatedData.description,
          service_categories: validatedData.service_categories, // This exists in base schema
          updated_at: new Date().toISOString(),
          location: validatedData.business_address, // Use location which definitely exists
        };

        // Only include service_areas if the error wasn't specifically about service_areas
        const isServiceAreasError =
          updateError.message?.includes('service_areas');
        if (!isServiceAreasError) {
          updateDataMinimal.service_areas = validatedData.service_areas;
          console.log('Including service_areas in retry');
        } else {
          console.log(
            'Excluding service_areas from retry (column does not exist)'
          );
        }

        const retryResult = await supabase
          .from('business_profiles')
          .update(updateDataMinimal)
          .eq('user_id', userId)
          .select();

        console.log('Step2 API - Retry update result:', {
          success: !retryResult.error,
          error: retryResult.error?.message,
          updatedProfile: retryResult.data?.[0],
        });

        businessProfile =
          retryResult.data && retryResult.data.length > 0
            ? retryResult.data[0]
            : null;
        updateError = retryResult.error;
      }

      if (updateError) {
        console.error('Error updating business profile:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to update business profile',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      // Update onboarding status - preserve existing step completions
      const { data: existingStatus } = await supabase
        .from('contractor_onboarding_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      await supabase.from('contractor_onboarding_status').upsert(
        {
          user_id: userId,
          step1_completed: existingStatus?.step1_completed || false,
          step2_completed: true,
          step3_completed: existingStatus?.step3_completed || false,
          step4_completed: existingStatus?.step4_completed || false,
          is_submitted: existingStatus?.is_submitted || false,
          approval_status: existingStatus?.approval_status || 'pending',
        },
        {
          onConflict: 'user_id', // Specify conflict resolution column
        }
      );

      return NextResponse.json({
        success: true,
        business_profile: businessProfile,
        message: 'Business profile updated successfully',
      });
    } else {
      // Create new business profile
      // Clean up social_links - remove empty strings and convert to null if all empty
      const socialLinks = validatedData.social_links;
      const cleanedSocialLinks = socialLinks
        ? Object.fromEntries(
            Object.entries(socialLinks).map(([key, value]) => [
              key,
              value === '' ? null : value,
            ])
          )
        : null;

      const insertData: any = {
        user_id: userId,
        company_name: validatedData.company_name,
        description: validatedData.description,
        service_areas: validatedData.service_areas,
        service_categories: validatedData.service_categories,
        average_rating: 0,
        review_count: 0,
        is_verified: false,
        subscription_tier: 'essential',
        location: validatedData.business_address, // Use location column which definitely exists
        business_address: validatedData.business_address, // Try to include if column exists
      };

      console.log(
        'Step2 API - Inserting business profile with service_areas:',
        validatedData.service_areas
      );

      if (validatedData.nzbn) {
        insertData.nzbn = validatedData.nzbn;
      }

      if (validatedData.logo_url && validatedData.logo_url.trim() !== '') {
        insertData.logo_url = validatedData.logo_url;
      }

      // Handle social_links - only include if at least one field has a value
      if (cleanedSocialLinks) {
        const hasAnyLink = Object.values(cleanedSocialLinks).some(
          v => v !== null && v !== ''
        );
        if (hasAnyLink) {
          insertData.social_links = cleanedSocialLinks;
        }
        // If no links, don't include social_links (will be null in DB)
      }

      // Try insert with business_address first
      const { data: insertedProfiles, error: createError } = await supabase
        .from('business_profiles')
        .insert(insertData)
        .select();

      console.log('Step2 API - Insert result:', {
        success: !createError,
        error: createError?.message,
        insertedProfile: insertedProfiles?.[0],
        service_areas_in_result: insertedProfiles?.[0]?.service_areas,
      });

      // Get the first inserted profile (or null if none)
      let businessProfile =
        insertedProfiles && insertedProfiles.length > 0
          ? insertedProfiles[0]
          : null;

      // If insert fails due to missing columns, retry with only base schema columns
      if (
        createError &&
        (createError.message?.includes('business_address') ||
          createError.message?.includes('nzbn') ||
          createError.message?.includes('service_areas') ||
          createError.message?.includes('social_links'))
      ) {
        console.log(
          'Some columns not found, retrying with only base schema columns. Error:',
          createError.message
        );
        // Use only columns that exist in the base schema
        const insertDataMinimal: any = {
          user_id: userId,
          company_name: validatedData.company_name,
          description: validatedData.description,
          service_categories: validatedData.service_categories, // This exists in base schema
          average_rating: 0,
          review_count: 0,
          is_verified: false,
          subscription_tier: 'essential',
          location: validatedData.business_address, // Use location which definitely exists
        };

        // Only include service_areas if the error wasn't specifically about service_areas
        const isServiceAreasError =
          createError.message?.includes('service_areas');
        if (!isServiceAreasError) {
          insertDataMinimal.service_areas = validatedData.service_areas;
          console.log('Including service_areas in retry');
        } else {
          console.log(
            'Excluding service_areas from retry (column does not exist)'
          );
        }

        const retryResult = await supabase
          .from('business_profiles')
          .insert(insertDataMinimal)
          .select();

        console.log('Step2 API - Retry insert result:', {
          success: !retryResult.error,
          error: retryResult.error?.message,
          insertedProfile: retryResult.data?.[0],
        });

        businessProfile =
          retryResult.data && retryResult.data.length > 0
            ? retryResult.data[0]
            : null;
        createError = retryResult.error;
      }

      if (createError) {
        console.error('Error creating business profile:', createError);
        return NextResponse.json(
          {
            error: 'Failed to create business profile',
            details: createError.message,
          },
          { status: 500 }
        );
      }

      // Update onboarding status - preserve existing step completions
      const { data: existingStatus } = await supabase
        .from('contractor_onboarding_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      await supabase.from('contractor_onboarding_status').upsert(
        {
          user_id: userId,
          step1_completed: existingStatus?.step1_completed || false,
          step2_completed: true,
          step3_completed: existingStatus?.step3_completed || false,
          step4_completed: existingStatus?.step4_completed || false,
          is_submitted: existingStatus?.is_submitted || false,
          approval_status: existingStatus?.approval_status || 'pending',
        },
        {
          onConflict: 'user_id', // Specify conflict resolution column
        }
      );

      return NextResponse.json({
        success: true,
        business_profile: businessProfile,
        message: 'Business profile created successfully',
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
