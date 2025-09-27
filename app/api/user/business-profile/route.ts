import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { z } from 'zod';

const updateBusinessProfileSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  website: z.string().url('Invalid website URL').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  service_categories: z
    .array(z.string())
    .max(10, 'Too many service categories')
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: businessProfile, error: businessProfileError } =
      await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (businessProfileError) {
      return NextResponse.json(
        {
          error: 'Business profile not found',
          details: businessProfileError.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ businessProfile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateBusinessProfileSchema.parse(body);

    const { data: businessProfile, error: businessProfileError } =
      await supabase
        .from('business_profiles')
        .update(validatedData)
        .eq('user_id', user.id)
        .select()
        .single();

    if (businessProfileError) {
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

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateBusinessProfileSchema.parse(body);

    // Check if business profile already exists
    const { data: existingProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Business profile already exists' },
        { status: 400 }
      );
    }

    const { data: businessProfile, error: businessProfileError } =
      await supabase
        .from('business_profiles')
        .insert({
          user_id: user.id,
          ...validatedData,
          subscription_tier: 'essential',
        })
        .select()
        .single();

    if (businessProfileError) {
      return NextResponse.json(
        {
          error: 'Failed to create business profile',
          details: businessProfileError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Business profile created successfully',
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
