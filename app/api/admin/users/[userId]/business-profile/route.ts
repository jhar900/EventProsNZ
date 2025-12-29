import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { z } from 'zod';

const updateBusinessProfileSchema = z.object({
  company_name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  location: z.string().max(100).optional().nullable(),
  subscription_tier: z.enum(['essential', 'showcase', 'spotlight']).optional(),
  service_categories: z.array(z.string()).optional().nullable(),
  is_verified: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;

    // Get business profile for this user
    const { data: businessProfile, error: businessProfileError } =
      await adminSupabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (businessProfileError) {
      console.error('Error fetching business profile:', businessProfileError);
      return NextResponse.json(
        {
          error: 'Failed to fetch business profile',
          details: businessProfileError.message,
        },
        { status: 500 }
      );
    }

    if (!businessProfile) {
      return NextResponse.json({ businessProfile: null });
    }

    return NextResponse.json({ businessProfile });
  } catch (error) {
    console.error(
      'Error in GET /api/admin/users/[userId]/business-profile:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return (
        authResult.response ||
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
    }

    const { userId } = params;
    const adminSupabase = authResult.supabase || supabaseAdmin;
    const body = await request.json();

    const validatedData = updateBusinessProfileSchema.parse(body);

    // Use admin client to update business profile
    const { data: businessProfile, error: businessProfileError } =
      await adminSupabase
        .from('business_profiles')
        .update(validatedData)
        .eq('user_id', userId)
        .select()
        .single();

    if (businessProfileError) {
      // If business profile doesn't exist, create it
      if (businessProfileError.code === 'PGRST116') {
        const { data: newBusinessProfile, error: createError } =
          await adminSupabase
            .from('business_profiles')
            .insert({
              user_id: userId,
              ...validatedData,
            })
            .select()
            .single();

        if (createError) {
          return NextResponse.json(
            {
              error: 'Failed to create business profile',
              details: createError.message,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: 'Business profile created successfully',
          businessProfile: newBusinessProfile,
        });
      }

      return NextResponse.json(
        {
          error: 'Failed to update business profile',
          details: businessProfileError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Business profile updated successfully',
      businessProfile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
