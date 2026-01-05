import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';
import { z } from 'zod';

const serviceSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  service_type: z.string().min(1, 'Service type is required'),
  description: z.string().optional(),
  price_range_min: z.number().min(0).optional(),
  price_range_max: z.number().min(0).optional(),
  exact_price: z.number().min(0).optional(),
  hourly_rate: z.number().min(0).optional(),
  daily_rate: z.number().min(0).optional(),
  hide_price: z.boolean().default(false),
  contact_for_pricing: z.boolean().default(false),
  is_free: z.boolean().default(false),
  availability: z.string().optional(),
  is_visible: z.boolean().default(true),
});

const serviceUpdateSchema = serviceSchema.extend({
  id: z.string().uuid().optional(),
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

    // Get business profile ID for this user
    const { data: businessProfile, error: profileError } = await adminSupabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json({ services: [] });
    }

    const businessProfileId = businessProfile.id;

    // Fetch services for this business profile
    const { data: services, error: servicesError } = await adminSupabase
      .from('services')
      .select('*')
      .eq('business_profile_id', businessProfileId)
      .order('created_at', { ascending: false });

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 400 }
      );
    }

    // Map database structure to component structure
    const mappedServices = (services || []).map(service => ({
      id: service.id,
      user_id: userId,
      service_name: service.service_name || service.name || '',
      service_type: service.category || service.service_type || '',
      description: service.description || '',
      price_range_min: service.price_range_min || undefined,
      price_range_max: service.price_range_max || undefined,
      exact_price: service.exact_price || undefined,
      hourly_rate: service.hourly_rate || undefined,
      daily_rate: service.daily_rate || undefined,
      hide_price: service.hide_price || false,
      contact_for_pricing: service.contact_for_pricing || false,
      is_free: service.is_free || false,
      availability: service.availability || '',
      is_visible: service.is_available !== false,
      created_at: service.created_at,
    }));

    return NextResponse.json({ services: mappedServices });
  } catch (error) {
    console.error('Error in GET /api/admin/users/[userId]/services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const validatedData = serviceSchema.parse(body);

    // Get business profile ID for this user
    const { data: businessProfile, error: profileError } = await adminSupabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        {
          error:
            'Business profile not found. Please complete your business profile first.',
        },
        { status: 404 }
      );
    }

    const businessProfileId = businessProfile.id;

    // Create new service
    const serviceData: any = {
      business_profile_id: businessProfileId,
      name: validatedData.service_name,
      service_name: validatedData.service_name,
      category: validatedData.service_type,
      description: validatedData.description || validatedData.service_name,
      is_available: validatedData.is_visible !== false,
      hide_price: validatedData.hide_price || false,
      contact_for_pricing: validatedData.contact_for_pricing || false,
      is_free: validatedData.is_free || false,
    };

    if (validatedData.price_range_min !== undefined) {
      serviceData.price_range_min = validatedData.price_range_min;
    }
    if (validatedData.price_range_max !== undefined) {
      serviceData.price_range_max = validatedData.price_range_max;
    }
    if (validatedData.exact_price !== undefined) {
      serviceData.exact_price = validatedData.exact_price;
    }
    if (validatedData.hourly_rate !== undefined) {
      serviceData.hourly_rate = validatedData.hourly_rate;
    }
    if (validatedData.daily_rate !== undefined) {
      serviceData.daily_rate = validatedData.daily_rate;
    }
    if (validatedData.availability !== undefined) {
      serviceData.availability = validatedData.availability.trim() || null;
    }

    let { data: service, error: createError } = await adminSupabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();

    if (createError && createError.message?.includes('availability')) {
      const retryData = { ...serviceData };
      delete retryData.availability;

      const retryResult = await adminSupabase
        .from('services')
        .insert(retryData)
        .select()
        .single();

      service = retryResult.data;
      createError = retryResult.error;
    }

    if (createError) {
      console.error('Error creating service:', createError);
      return NextResponse.json(
        { error: 'Failed to create service', details: createError.message },
        { status: 400 }
      );
    }

    const mappedService = {
      id: service.id,
      user_id: userId,
      service_name: service.service_name || service.name || '',
      service_type: service.category || service.service_type || '',
      description: service.description || '',
      price_range_min: service.price_range_min || undefined,
      price_range_max: service.price_range_max || undefined,
      exact_price: service.exact_price || undefined,
      hourly_rate: service.hourly_rate || undefined,
      daily_rate: service.daily_rate || undefined,
      hide_price: service.hide_price || false,
      contact_for_pricing: service.contact_for_pricing || false,
      is_free: service.is_free || false,
      availability: service.availability || '',
      is_visible: service.is_available !== false,
      created_at: service.created_at,
    };

    return NextResponse.json({ service: mappedService });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in POST /api/admin/users/[userId]/services:', error);
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
    const validatedData = serviceUpdateSchema.parse(body);

    if (!validatedData.id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get business profile ID for this user
    const { data: businessProfile, error: profileError } = await adminSupabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    const businessProfileId = businessProfile.id;

    // Verify the service belongs to this business profile
    const { data: existingService, error: checkError } = await adminSupabase
      .from('services')
      .select('business_profile_id')
      .eq('id', validatedData.id)
      .single();

    if (checkError || !existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (existingService.business_profile_id !== businessProfileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update service
    const updateData: any = {
      name: validatedData.service_name,
      service_name: validatedData.service_name,
      category: validatedData.service_type,
      description: validatedData.description || validatedData.service_name,
      is_available: validatedData.is_visible !== false,
      hide_price: validatedData.hide_price || false,
      contact_for_pricing: validatedData.contact_for_pricing || false,
      is_free: validatedData.is_free || false,
      updated_at: new Date().toISOString(),
    };

    if (validatedData.price_range_min !== undefined) {
      updateData.price_range_min = validatedData.price_range_min;
    }
    if (validatedData.price_range_max !== undefined) {
      updateData.price_range_max = validatedData.price_range_max;
    }
    if (validatedData.exact_price !== undefined) {
      updateData.exact_price = validatedData.exact_price;
    }
    if (validatedData.hourly_rate !== undefined) {
      updateData.hourly_rate = validatedData.hourly_rate;
    }
    if (validatedData.daily_rate !== undefined) {
      updateData.daily_rate = validatedData.daily_rate;
    }
    if (validatedData.availability !== undefined) {
      updateData.availability = validatedData.availability.trim() || null;
    }

    let { data: service, error: updateError } = await adminSupabase
      .from('services')
      .update(updateData)
      .eq('id', validatedData.id)
      .select()
      .single();

    if (updateError && updateError.message?.includes('availability')) {
      const retryData = { ...updateData };
      delete retryData.availability;

      const retryResult = await adminSupabase
        .from('services')
        .update(retryData)
        .eq('id', validatedData.id)
        .select()
        .single();

      service = retryResult.data;
      updateError = retryResult.error;
    }

    if (updateError) {
      console.error('Error updating service:', updateError);
      return NextResponse.json(
        { error: 'Failed to update service', details: updateError.message },
        { status: 400 }
      );
    }

    const mappedService = {
      id: service.id,
      user_id: userId,
      service_name: service.service_name || service.name || '',
      service_type: service.category || service.service_type || '',
      description: service.description || '',
      price_range_min: service.price_range_min || undefined,
      price_range_max: service.price_range_max || undefined,
      exact_price: service.exact_price || undefined,
      hourly_rate: service.hourly_rate || undefined,
      daily_rate: service.daily_rate || undefined,
      hide_price: service.hide_price || false,
      contact_for_pricing: service.contact_for_pricing || false,
      is_free: service.is_free || false,
      availability: service.availability || '',
      is_visible: service.is_available !== false,
      created_at: service.created_at,
    };

    return NextResponse.json({ service: mappedService });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in PUT /api/admin/users/[userId]/services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
