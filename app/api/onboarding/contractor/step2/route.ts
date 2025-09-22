import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const step2Schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  business_address: z.string().min(5, 'Business address is required'),
  nzbn: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  service_areas: z
    .array(z.string())
    .min(1, 'At least one service area is required'),
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
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = step2Schema.parse(body);

    // Check if user already has a business profile
    const { data: existingBusinessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingBusinessProfile) {
      // Update existing business profile
      const { data: businessProfile, error: updateError } = await supabase
        .from('business_profiles')
        .update({
          company_name: validatedData.company_name,
          business_address: validatedData.business_address,
          nzbn: validatedData.nzbn,
          description: validatedData.description,
          service_areas: validatedData.service_areas,
          social_links: validatedData.social_links,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update business profile' },
          { status: 500 }
        );
      }

      // Update onboarding status
      await supabase.from('contractor_onboarding_status').upsert({
        user_id: user.id,
        step2_completed: true,
      });

      return NextResponse.json({
        success: true,
        business_profile: businessProfile,
        message: 'Business profile updated successfully',
      });
    } else {
      // Create new business profile
      const { data: businessProfile, error: createError } = await supabase
        .from('business_profiles')
        .insert({
          user_id: user.id,
          company_name: validatedData.company_name,
          business_address: validatedData.business_address,
          nzbn: validatedData.nzbn,
          description: validatedData.description,
          service_areas: validatedData.service_areas,
          social_links: validatedData.social_links,
          service_categories: [], // Will be populated in step 3
          average_rating: 0,
          review_count: 0,
          is_verified: false,
          subscription_tier: 'essential',
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create business profile' },
          { status: 500 }
        );
      }

      // Update onboarding status
      await supabase.from('contractor_onboarding_status').upsert({
        user_id: user.id,
        step2_completed: true,
      });

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

    console.error('Contractor Step 2 error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
