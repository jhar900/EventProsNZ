import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const serviceSchema = z.object({
  service_type: z.string().min(1, 'Service type is required'),
  description: z.string().optional(),
  price_range_min: z.number().min(0).optional(),
  price_range_max: z.number().min(0).optional(),
  availability: z.string().optional(),
  is_visible: z.boolean().default(true),
});

const serviceUpdateSchema = serviceSchema.extend({
  id: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (servicesError) {
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 400 }
      );
    }

    return NextResponse.json({ services: services || [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = serviceSchema.parse(body);

    // Create new service
    const { data: service, error: createError } = await supabase
      .from('services')
      .insert({
        user_id: user.id,
        ...validatedData,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 400 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = serviceUpdateSchema.parse(body);

    if (!validatedData.id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Update service
    const { data: service, error: updateError } = await supabase
      .from('services')
      .update({
        service_type: validatedData.service_type,
        description: validatedData.description,
        price_range_min: validatedData.price_range_min,
        price_range_max: validatedData.price_range_max,
        availability: validatedData.availability,
        is_visible: validatedData.is_visible,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update service' },
        { status: 400 }
      );
    }

    return NextResponse.json({ service });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
