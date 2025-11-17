import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const step3Schema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Your position/role is required'),
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
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Create Supabase client with service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Validate request body
    const body = await request.json();
    const validatedData = step3Schema.parse(body);

    // Check if user already has a business profile
    const { data: existingBusinessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Update profile with position/role
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile with position
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          // Store position in preferences JSONB field
          preferences: {
            ...((existingProfile.preferences as any) || {}),
            position: validatedData.position,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (profileUpdateError) {
        console.error(
          'Failed to update profile with position:',
          profileUpdateError
        );
        // Continue anyway - position is not critical
      }
    }

    const businessProfileData = {
      user_id: userId,
      company_name: validatedData.company_name,
      description: validatedData.description,
      location: validatedData.business_address,
      service_categories: validatedData.service_areas,
      website: validatedData.social_links?.website || null,
      is_verified: false,
      subscription_tier: 'essential' as const,
    };

    if (existingBusinessProfile) {
      // Update existing business profile
      const { data: businessProfile, error: updateError } = await supabase
        .from('business_profiles')
        .update({
          ...businessProfileData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update business profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        business_profile: businessProfile,
        message: 'Business profile updated successfully',
      });
    } else {
      // Create new business profile
      const { data: businessProfile, error: createError } = await supabase
        .from('business_profiles')
        .insert(businessProfileData)
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create business profile' },
          { status: 500 }
        );
      }

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
