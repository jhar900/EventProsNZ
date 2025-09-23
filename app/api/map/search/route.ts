/**
 * Map Search API
 * GET /api/map/search - Search for locations and contractors
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapService } from '@/lib/maps/map-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q');
    const north = parseFloat(searchParams.get('north') || '0');
    const south = parseFloat(searchParams.get('south') || '0');
    const east = parseFloat(searchParams.get('east') || '0');
    const west = parseFloat(searchParams.get('west') || '0');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        query: query || '',
      });
    }

    const supabase = createClient();
    const searchQuery = `%${query.trim()}%`;

    // Search contractors with proper query chaining
    const { data: contractors, error: contractorsError } = await supabase
      .from('business_profiles')
      .select(
        `
        user_id,
        company_name,
        business_address,
        users!inner(
          id,
          role
        ),
        services!inner(
          service_type
        )
      `
      )
      .eq('users.role', 'contractor')
      .or(
        `company_name.ilike.${searchQuery},business_address.ilike.${searchQuery}`
      )
      .limit(10);

    if (contractorsError) {
      console.error('Error searching contractors:', contractorsError);
    }

    // Transform contractor results with proper geocoding
    const contractorResults = await Promise.all(
      contractors?.map(async contractor => {
        let location = { lat: -36.8485, lng: 174.7633 }; // Default fallback

        if (contractor.business_address) {
          const geocodedLocation = await mapService.geocodeAddress(
            contractor.business_address
          );
          if (geocodedLocation) {
            location = geocodedLocation;
          }
        }

        return {
          id: contractor.user_id,
          name: contractor.company_name,
          location,
          type: 'contractor' as const,
          service_type: contractor.services?.[0]?.service_type,
          address: contractor.business_address,
        };
      }) || []
    );

    // In a real implementation, you would also search for:
    // - Addresses using geocoding
    // - Points of interest
    // - Other location-based data

    const results = [
      ...contractorResults,
      // Add mock address results for demonstration
      {
        id: 'address-1',
        name: `${query} - Auckland, New Zealand`,
        location: {
          lat: -36.8485,
          lng: 174.7633,
        },
        type: 'address' as const,
      },
      {
        id: 'poi-1',
        name: `${query} Event Venue`,
        location: {
          lat: -36.8485,
          lng: 174.7633,
        },
        type: 'poi' as const,
      },
    ];

    return NextResponse.json({
      results,
      query,
      total: results.length,
    });
  } catch (error) {
    console.error('Map search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
