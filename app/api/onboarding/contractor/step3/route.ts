import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const serviceSchema = z.object({
  service_type: z.string().min(1, 'Service type is required'),
  description: z.string().optional(),
  price_range_min: z
    .number()
    .min(0, 'Minimum price must be non-negative')
    .optional(),
  price_range_max: z
    .number()
    .min(0, 'Maximum price must be non-negative')
    .optional(),
  availability: z.string().optional(),
});

const step3Schema = z.object({
  services: z.array(serviceSchema).min(1, 'At least one service is required'),
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
    const validatedData = step3Schema.parse(body);

    // Validate price ranges
    for (const service of validatedData.services) {
      if (
        service.price_range_min &&
        service.price_range_max &&
        service.price_range_min > service.price_range_max
      ) {
        return NextResponse.json(
          { error: 'Minimum price cannot be greater than maximum price' },
          { status: 400 }
        );
      }
    }

    // Delete existing services for this user
    await supabase.from('services').delete().eq('user_id', user.id);

    // Insert new services
    const servicesWithUserId = validatedData.services.map(service => ({
      ...service,
      user_id: user.id,
    }));

    const { data: services, error: createError } = await supabase
      .from('services')
      .insert(servicesWithUserId)
      .select();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create services' },
        { status: 500 }
      );
    }

    // Update business profile with service categories
    const serviceCategories = validatedData.services.map(
      service => service.service_type
    );
    await supabase
      .from('business_profiles')
      .update({
        service_categories: serviceCategories,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Update onboarding status
    await supabase.from('contractor_onboarding_status').upsert({
      user_id: user.id,
      step3_completed: true,
    });

    return NextResponse.json({
      success: true,
      services,
      message: 'Services created successfully',
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
