import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/middleware';
import { z } from 'zod';

const serviceSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
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
    // Try to get user ID from header first
    let userId = request.headers.get('x-user-id');

    // If no header, try cookie-based auth
    if (!userId) {
      const { supabase } = createClient(request);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let user = session?.user;

      if (!user) {
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !getUserUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = getUserUser;
      }

      userId = user.id;
    }

    // Get business profile ID for this user
    const { data: businessProfile, error: profileError } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      // If no business profile, return empty array
      return NextResponse.json({ services: [] });
    }

    const businessProfileId = businessProfile.id;

    // Fetch services for this business profile
    const { data: services, error: servicesError } = await supabaseAdmin
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
      user_id: userId, // For component compatibility
      service_name: service.service_name || service.name || '',
      service_type: service.category || service.service_type || '',
      description: service.description || '',
      price_range_min: service.price_range_min || undefined,
      price_range_max: service.price_range_max || undefined,
      availability: service.availability || '', // May not exist in all schemas
      is_visible: service.is_available !== false, // Map is_available to is_visible
      created_at: service.created_at,
    }));

    return NextResponse.json({ services: mappedServices });
  } catch (error) {
    console.error('Error in GET /api/profile/me/services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to get user ID from header first
    let userId = request.headers.get('x-user-id');

    // If no header, try cookie-based auth
    if (!userId) {
      const { supabase } = createClient(request);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let user = session?.user;

      if (!user) {
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !getUserUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = getUserUser;
      }

      userId = user.id;
    }

    const body = await request.json();
    const validatedData = serviceSchema.parse(body);

    // Get business profile ID for this user
    const { data: businessProfile, error: profileError } = await supabaseAdmin
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

    // Create new service - map component fields to database fields
    // Try with availability first, retry without it if the column doesn't exist
    const serviceData: any = {
      business_profile_id: businessProfileId,
      name: validatedData.service_name, // Use service_name as name
      service_name: validatedData.service_name, // Also set service_name (required column)
      category: validatedData.service_type, // Map service_type to category
      description: validatedData.description || validatedData.service_name,
      is_available: validatedData.is_visible !== false,
    };

    if (validatedData.price_range_min !== undefined) {
      serviceData.price_range_min = validatedData.price_range_min;
    }
    if (validatedData.price_range_max !== undefined) {
      serviceData.price_range_max = validatedData.price_range_max;
    }
    // Always include availability (even if empty, to allow clearing it)
    if (validatedData.availability !== undefined) {
      serviceData.availability = validatedData.availability.trim() || null;
    }

    let { data: service, error: createError } = await supabaseAdmin
      .from('services')
      .insert(serviceData)
      .select()
      .single();

    // If insert fails due to missing availability column, retry without it
    if (createError && createError.message?.includes('availability')) {
      console.log('Retrying insert without availability column');
      const retryData = { ...serviceData };
      delete retryData.availability;

      const retryResult = await supabaseAdmin
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

    // Map back to component structure
    const mappedService = {
      id: service.id,
      user_id: userId,
      service_type: service.category || service.service_type || '',
      description: service.description || '',
      price_range_min: service.price_range_min || undefined,
      price_range_max: service.price_range_max || undefined,
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
    console.error('Error in POST /api/profile/me/services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try to get user ID from header first
    let userId = request.headers.get('x-user-id');

    // If no header, try cookie-based auth
    if (!userId) {
      const { supabase } = createClient(request);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let user = session?.user;

      if (!user) {
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !getUserUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = getUserUser;
      }

      userId = user.id;
    }

    const body = await request.json();
    const validatedData = serviceUpdateSchema.parse(body);

    if (!validatedData.id) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get business profile ID for this user to verify ownership
    const { data: businessProfile, error: profileError } = await supabaseAdmin
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
    const { data: existingService, error: checkError } = await supabaseAdmin
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

    // Update service - map component fields to database fields
    // Try with availability first, retry without it if the column doesn't exist
    const updateData: any = {
      name: validatedData.service_name,
      service_name: validatedData.service_name,
      category: validatedData.service_type,
      description: validatedData.description || validatedData.service_name,
      is_available: validatedData.is_visible !== false,
      updated_at: new Date().toISOString(),
    };

    if (validatedData.price_range_min !== undefined) {
      updateData.price_range_min = validatedData.price_range_min;
    }
    if (validatedData.price_range_max !== undefined) {
      updateData.price_range_max = validatedData.price_range_max;
    }
    // Always include availability (even if empty, to allow clearing it)
    if (validatedData.availability !== undefined) {
      updateData.availability = validatedData.availability.trim() || null;
    }

    let { data: service, error: updateError } = await supabaseAdmin
      .from('services')
      .update(updateData)
      .eq('id', validatedData.id)
      .select()
      .single();

    // If update fails due to missing availability column, retry without it
    if (updateError && updateError.message?.includes('availability')) {
      console.log('Retrying update without availability column');
      const retryData = { ...updateData };
      delete retryData.availability;

      const retryResult = await supabaseAdmin
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

    // Map back to component structure
    const mappedService = {
      id: service.id,
      user_id: userId,
      service_name: service.service_name || service.name || '',
      service_type: service.category || service.service_type || '',
      description: service.description || '',
      price_range_min: service.price_range_min || undefined,
      price_range_max: service.price_range_max || undefined,
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
    console.error('Error in PUT /api/profile/me/services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
