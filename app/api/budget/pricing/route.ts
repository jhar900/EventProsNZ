import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PricingService } from '@/lib/budget/pricing-service';
import { z } from 'zod';

const PricingQuerySchema = z.object({
  service_type: z.string().min(1),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
  seasonal: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');
    const locationParam = searchParams.get('location');
    const seasonalParam = searchParams.get('seasonal');

    if (!serviceType) {
      return NextResponse.json(
        { error: 'Service type is required' },
        { status: 400 }
      );
    }

    // Parse location if provided
    let location = undefined; // Use undefined instead of null for optional Zod fields
    if (locationParam) {
      try {
        location = JSON.parse(locationParam);
      } catch {
        return NextResponse.json(
          { error: 'Invalid location format' },
          { status: 400 }
        );
      }
    }

    // Parse seasonal flag
    const seasonal = seasonalParam === 'true';

    // Validate input
    const validation = PricingQuerySchema.safeParse({
      service_type: serviceType,
      location,
      seasonal,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // Use PricingService for actual pricing calculations
    const pricingService = new PricingService();

    try {
      // Get base pricing data
      const basePricing = await pricingService.getPricingData(
        serviceType,
        location
      );

      if (!basePricing) {
        return NextResponse.json(
          { error: 'No pricing data found for service type' },
          { status: 404 }
        );
      }

      let adjustedPricing = { ...basePricing };

      // Apply location adjustments if location is provided
      if (location) {
        adjustedPricing = pricingService.applyLocationAdjustments(
          adjustedPricing,
          location
        );
      }

      // Apply seasonal adjustments if requested
      if (seasonal) {
        const eventDate = new Date(); // Use current date for seasonal calculation
        adjustedPricing = pricingService.applySeasonalAdjustments(
          adjustedPricing,
          eventDate
        );
      }

      // Get real-time contractor pricing if available
      const realTimePricing = await pricingService.getRealTimePricing(
        serviceType,
        location
      );

      // Determine if we have real-time data
      const isRealTime =
        realTimePricing && realTimePricing.contractor_count > 0;

      return NextResponse.json({
        pricing: {
          service_type: serviceType,
          base_pricing: basePricing,
          adjusted_pricing: adjustedPricing,
          real_time_pricing: realTimePricing,
          location: location,
          seasonal_applied: seasonal,
          data_freshness: basePricing.updated_at,
          confidence_score: isRealTime ? 0.9 : 0.7,
        },
        real_time: isRealTime,
        metadata: {
          location_applied: !!location,
          seasonal_applied: seasonal,
          contractor_data_available: isRealTime,
          generated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to calculate pricing data' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
