import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = params;
    const body = await request.json();

    const validatedData = updateBusinessProfileSchema.parse(body);

    // Use admin client to update business profile
    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .update(validatedData)
        .eq('user_id', userId)
        .select()
        .single();

    if (businessProfileError) {
      // If business profile doesn't exist, create it
      if (businessProfileError.code === 'PGRST116') {
        const { data: newBusinessProfile, error: createError } =
          await supabaseAdmin
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
