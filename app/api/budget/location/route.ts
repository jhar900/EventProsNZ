import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const LocationQuerySchema = z.object({
  service_type: z.string().min(1),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
  }),
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

    if (!serviceType || !locationParam) {
      return NextResponse.json(
        {
          error: 'Service type and location are required',
        },
        { status: 400 }
      );
    }

    // Parse location
    let location;
    try {
      location = JSON.parse(locationParam);
    } catch {
      return NextResponse.json(
        { error: 'Invalid location format' },
        { status: 400 }
      );
    }

    // Validate input
    const validation = LocationQuerySchema.safeParse({
      service_type: serviceType,
      location,
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

    const { service_type, location: loc } = validation.data;

    // Get base pricing data
    const { data: pricingData, error: pricingError } = await supabase
      .from('pricing_data')
      .select('*')
      .eq('service_type', service_type)
      .order('created_at', { ascending: false })
      .limit(1);

    if (pricingError) {
      console.error('Error fetching pricing data:', pricingError);
      return NextResponse.json(
        { error: 'Failed to fetch pricing data' },
        { status: 500 }
      );
    }

    if (!pricingData || pricingData.length === 0) {
      return NextResponse.json(
        {
          error: 'No pricing data found for service type',
        },
        { status: 404 }
      );
    }

    const basePricing = pricingData[0];

    // Calculate location-based adjustments
    const locationAdjustments = calculateLocationAdjustments(loc, service_type);

    // Apply location adjustments to pricing
    const adjustedPricing = {
      service_type: service_type,
      base_pricing: basePricing,
      location_adjustment: locationAdjustments,
      adjusted_prices: {
        price_min:
          Math.round(
            basePricing.price_min * locationAdjustments.multiplier * 100
          ) / 100,
        price_max:
          Math.round(
            basePricing.price_max * locationAdjustments.multiplier * 100
          ) / 100,
        price_average:
          Math.round(
            basePricing.price_average * locationAdjustments.multiplier * 100
          ) / 100,
      },
      cost_analysis: {
        is_high_cost_area: locationAdjustments.multiplier > 1.2,
        is_low_cost_area: locationAdjustments.multiplier < 0.8,
        cost_category: locationAdjustments.cost_category,
        potential_savings:
          locationAdjustments.multiplier < 1
            ? Math.round(
                basePricing.price_average *
                  (1 - locationAdjustments.multiplier) *
                  100
              ) / 100
            : 0,
        recommendation: getLocationRecommendation(locationAdjustments),
      },
    };

    return NextResponse.json({
      pricing: adjustedPricing,
      metadata: {
        service_type: service_type,
        location: loc,
        cost_category: locationAdjustments.cost_category,
        multiplier: locationAdjustments.multiplier,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Location pricing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateLocationAdjustments(location: any, serviceType: string) {
  const { lat, lng, city, region } = location;

  // Define cost categories based on location
  const costCategories = {
    // Major metropolitan areas (high cost)
    major_metro: {
      cities: [
        'New York',
        'San Francisco',
        'Los Angeles',
        'Chicago',
        'Boston',
        'Seattle',
        'Washington',
        'Miami',
      ],
      regions: ['California', 'New York', 'Massachusetts', 'Washington'],
      multiplier: 1.3,
      category: 'high_cost',
    },

    // Secondary cities (moderate-high cost)
    secondary_city: {
      cities: [
        'Austin',
        'Denver',
        'Portland',
        'Nashville',
        'Atlanta',
        'Phoenix',
        'Dallas',
        'Houston',
      ],
      regions: ['Texas', 'Colorado', 'Oregon', 'Georgia', 'Arizona'],
      multiplier: 1.1,
      category: 'moderate_high_cost',
    },

    // Suburban areas (moderate cost)
    suburban: {
      multiplier: 1.0,
      category: 'moderate_cost',
    },

    // Rural areas (low cost)
    rural: {
      multiplier: 0.8,
      category: 'low_cost',
    },
  };

  // Determine cost category based on city/region
  let costCategory = 'moderate_cost';
  let multiplier = 1.0;

  // Check for major metro areas
  if (
    city &&
    costCategories.major_metro.cities.some(c =>
      city.toLowerCase().includes(c.toLowerCase())
    )
  ) {
    costCategory = costCategories.major_metro.category;
    multiplier = costCategories.major_metro.multiplier;
  }
  // Check for major metro regions
  else if (
    region &&
    costCategories.major_metro.regions.some(r =>
      region.toLowerCase().includes(r.toLowerCase())
    )
  ) {
    costCategory = costCategories.major_metro.category;
    multiplier = costCategories.major_metro.multiplier;
  }
  // Check for secondary cities
  else if (
    city &&
    costCategories.secondary_city.cities.some(c =>
      city.toLowerCase().includes(c.toLowerCase())
    )
  ) {
    costCategory = costCategories.secondary_city.category;
    multiplier = costCategories.secondary_city.multiplier;
  }
  // Check for secondary regions
  else if (
    region &&
    costCategories.secondary_city.regions.some(r =>
      region.toLowerCase().includes(r.toLowerCase())
    )
  ) {
    costCategory = costCategories.secondary_city.category;
    multiplier = costCategories.secondary_city.multiplier;
  }
  // Determine if rural based on population density (simplified)
  else if (isRuralArea(lat, lng)) {
    costCategory = costCategories.rural.category;
    multiplier = costCategories.rural.multiplier;
  }

  // Apply service-specific adjustments
  const serviceAdjustments = getServiceSpecificAdjustments(
    serviceType,
    costCategory
  );
  multiplier *= serviceAdjustments.multiplier;

  return {
    cost_category: costCategory,
    multiplier: Math.round(multiplier * 100) / 100,
    base_multiplier: costCategories[costCategory]?.multiplier || 1.0,
    service_adjustment: serviceAdjustments.multiplier,
    factors: {
      location_type: costCategory,
      service_type: serviceType,
      city: city,
      region: region,
      coordinates: { lat, lng },
    },
  };
}

function isRuralArea(lat: number, lng: number): boolean {
  // Simplified rural area detection based on coordinates
  // In a real implementation, this would use more sophisticated geographic data

  // Example: Areas far from major cities
  const majorCities = [
    { lat: 40.7128, lng: -74.006, name: 'New York' },
    { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
    { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
    { lat: 29.7604, lng: -95.3698, name: 'Houston' },
    { lat: 33.4484, lng: -112.074, name: 'Phoenix' },
  ];

  const distances = majorCities.map(city =>
    calculateDistance(lat, lng, city.lat, city.lng)
  );

  const minDistance = Math.min(...distances);

  // If more than 100 miles from any major city, consider rural
  return minDistance > 100;
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getServiceSpecificAdjustments(
  serviceType: string,
  costCategory: string
) {
  // Different services have different location sensitivity
  const serviceAdjustments = {
    catering: {
      high_cost: 1.2,
      moderate_high_cost: 1.1,
      moderate_cost: 1.0,
      low_cost: 0.9,
    },
    photography: {
      high_cost: 1.3,
      moderate_high_cost: 1.1,
      moderate_cost: 1.0,
      low_cost: 0.8,
    },
    music: {
      high_cost: 1.4,
      moderate_high_cost: 1.2,
      moderate_cost: 1.0,
      low_cost: 0.7,
    },
    venue: {
      high_cost: 1.5,
      moderate_high_cost: 1.2,
      moderate_cost: 1.0,
      low_cost: 0.6,
    },
    decorations: {
      high_cost: 1.1,
      moderate_high_cost: 1.05,
      moderate_cost: 1.0,
      low_cost: 0.95,
    },
  };

  const adjustments =
    serviceAdjustments[serviceType] || serviceAdjustments['catering'];
  return {
    multiplier: adjustments[costCategory] || 1.0,
  };
}

function getLocationRecommendation(locationAdjustments: any) {
  const { cost_category, multiplier } = locationAdjustments;

  if (cost_category === 'high_cost') {
    return 'Consider booking services from nearby areas or negotiating package deals';
  } else if (cost_category === 'low_cost') {
    return 'Great location for budget-friendly services';
  } else if (multiplier > 1.2) {
    return 'Location has higher costs - consider alternatives or package deals';
  } else if (multiplier < 0.8) {
    return 'Location offers good value - take advantage of lower costs';
  } else {
    return 'Standard location pricing - good balance of cost and quality';
  }
}
