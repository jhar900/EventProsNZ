import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get all unique service categories
    const { data: serviceCategories, error: serviceError } = await supabase
      .from('business_profiles')
      .select('service_categories')
      .not('service_categories', 'is', null);

    if (serviceError) {
      console.error('Service categories error:', serviceError);
      return NextResponse.json(
        { error: 'Failed to fetch service categories' },
        { status: 500 }
      );
    }

    // Flatten and deduplicate service categories
    const allServiceTypes = new Set<string>();
    serviceCategories?.forEach(profile => {
      if (profile.service_categories) {
        profile.service_categories.forEach((category: string) => {
          allServiceTypes.add(category);
        });
      }
    });

    // Get all unique regions from service areas
    const { data: regions, error: regionsError } = await supabase
      .from('business_profiles')
      .select('service_areas')
      .not('service_areas', 'is', null);

    if (regionsError) {
      console.error('Regions error:', regionsError);
      return NextResponse.json(
        { error: 'Failed to fetch regions' },
        { status: 500 }
      );
    }

    // Flatten and deduplicate regions
    const allRegions = new Set<string>();
    regions?.forEach(profile => {
      if (profile.service_areas) {
        profile.service_areas.forEach((area: string) => {
          allRegions.add(area);
        });
      }
    });

    // Get price ranges from services
    const { data: priceRanges, error: priceError } = await supabase
      .from('services')
      .select('price_range_min, price_range_max')
      .not('price_range_min', 'is', null)
      .not('price_range_max', 'is', null);

    if (priceError) {
      console.error('Price ranges error:', priceError);
      return NextResponse.json(
        { error: 'Failed to fetch price ranges' },
        { status: 500 }
      );
    }

    // Calculate price range buckets
    const prices =
      priceRanges
        ?.flatMap(service => [service.price_range_min, service.price_range_max])
        .filter(price => price !== null) || [];

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Create price range buckets
    const priceRanges_buckets = [
      { label: 'Under $100', min: 0, max: 100 },
      { label: '$100 - $500', min: 100, max: 500 },
      { label: '$500 - $1,000', min: 500, max: 1000 },
      { label: '$1,000 - $2,500', min: 1000, max: 2500 },
      { label: '$2,500 - $5,000', min: 2500, max: 5000 },
      { label: 'Over $5,000', min: 5000, max: null },
    ].filter(range => range.max === null || range.max <= maxPrice);

    // Get rating ranges
    const { data: ratings, error: ratingError } = await supabase
      .from('business_profiles')
      .select('average_rating')
      .not('average_rating', 'is', null)
      .gt('average_rating', 0);

    if (ratingError) {
      console.error('Ratings error:', ratingError);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }

    const ratingRanges = [
      { label: '4+ Stars', min: 4, max: 5 },
      { label: '3+ Stars', min: 3, max: 5 },
      { label: '2+ Stars', min: 2, max: 5 },
      { label: '1+ Stars', min: 1, max: 5 },
    ];

    return NextResponse.json({
      service_types: Array.from(allServiceTypes).sort(),
      regions: Array.from(allRegions).sort(),
      price_ranges: priceRanges_buckets,
      rating_ranges: ratingRanges,
      min_price: minPrice,
      max_price: maxPrice,
    });
  } catch (error) {
    console.error('Filters API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
