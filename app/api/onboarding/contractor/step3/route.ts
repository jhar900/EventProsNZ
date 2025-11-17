import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const serviceSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
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
  services: z.array(serviceSchema).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client) - same approach as step1 and step2
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
    const validatedData = step3Schema.parse(body);

    // Get services array (default to empty if not provided)
    const services = validatedData.services || [];

    // Validate price ranges for any services provided
    for (const service of services) {
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

    // Get business profile ID for this user
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        {
          error: 'Business profile not found',
          details: 'Please complete the Business Information section first',
        },
        { status: 400 }
      );
    }

    const businessProfileId = businessProfile.id;

    // Delete existing services for this business profile
    await supabase
      .from('services')
      .delete()
      .eq('business_profile_id', businessProfileId);

    // Only insert services if there are any
    let insertedServices = [];
    if (services.length > 0) {
      // Filter out services without a service_name or service_type (incomplete services)
      const validServices = services.filter(
        service =>
          service.service_name &&
          service.service_name.trim() !== '' &&
          service.service_type &&
          service.service_type.trim() !== ''
      );

      if (validServices.length > 0) {
        // Map services to the services table structure
        // The table has both 'name' and 'service_name' columns - include both to be safe
        const servicesData = validServices.map(service => {
          const serviceData: any = {
            business_profile_id: businessProfileId,
            name: service.service_name, // 'name' column
            service_name: service.service_name, // 'service_name' column (required, NOT NULL)
            category: service.service_type, // 'category' column
            description: service.description || service.service_type || '', // Description is required
            is_available: true,
          };

          if (
            service.price_range_min !== undefined &&
            service.price_range_min !== null
          ) {
            serviceData.price_range_min = service.price_range_min;
          }
          if (
            service.price_range_max !== undefined &&
            service.price_range_max !== null
          ) {
            serviceData.price_range_max = service.price_range_max;
          }

          return serviceData;
        });

        // Insert services using business_profile_id
        const { data: insertedData, error: createError } = await supabase
          .from('services')
          .insert(servicesData)
          .select();

        if (createError) {
          console.error('Step3 API - Error creating services:', createError);
          console.error('Step3 API - Services data:', servicesData);
          console.error('Step3 API - Error message:', createError.message);
          console.error('Step3 API - Error code:', createError.code);

          return NextResponse.json(
            {
              error: 'Failed to create services',
              details: createError.message,
              code: createError.code,
              hint: 'Check server console for full error details',
            },
            { status: 500 }
          );
        }

        insertedServices = insertedData || [];
      }
    }

    // Update business profile with service categories (only if services were provided)
    // Note: service_categories should already be set from step 2, so we only update if we have new services
    if (insertedServices.length > 0) {
      // Extract categories from inserted services (they're stored in 'category' column)
      const serviceCategories = insertedServices
        .map(service => service.category || service.service_type)
        .filter(Boolean);

      if (serviceCategories.length > 0) {
        await supabase
          .from('business_profiles')
          .update({
            service_categories: serviceCategories,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }
    }

    // Update onboarding status - preserve existing step completions
    const { data: existingStatus, error: statusFetchError } = await supabase
      .from('contractor_onboarding_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Step3 API - Existing status:', existingStatus);
    console.log('Step3 API - Status fetch error:', statusFetchError);

    const updatedStatus = {
      user_id: userId,
      step1_completed: existingStatus?.step1_completed ?? false,
      step2_completed: existingStatus?.step2_completed ?? false,
      step3_completed: true,
      step4_completed: existingStatus?.step4_completed ?? false,
      is_submitted: existingStatus?.is_submitted ?? false,
      approval_status: existingStatus?.approval_status ?? 'pending',
    };

    console.log('Step3 API - Updating status with:', updatedStatus);

    const { data: updatedStatusData, error: statusUpdateError } = await supabase
      .from('contractor_onboarding_status')
      .upsert(updatedStatus, {
        onConflict: 'user_id', // Specify conflict resolution column
      })
      .select();

    console.log('Step3 API - Status update result:', updatedStatusData);
    console.log('Step3 API - Status update error:', statusUpdateError);

    return NextResponse.json({
      success: true,
      services: insertedServices,
      message:
        insertedServices.length > 0
          ? 'Services created successfully'
          : 'Step completed (no services added)',
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
