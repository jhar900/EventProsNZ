/**
 * Proximity Suggestions API
 * GET /api/map/proximity/suggestions - Get location suggestions for proximity search
 */

import { NextRequest, NextResponse } from 'next/server';
import { mapService } from '@/lib/maps/map-service';

export const dynamic = 'force-dynamic';

export interface LocationSuggestion {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  type: 'address' | 'poi' | 'city';
  formatted_address: string;
}

export interface ProximitySuggestionsResponse {
  suggestions: LocationSuggestion[];
  query: string;
}

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
        suggestions: [],
        query: query || '',
      });
    }

    // Use Mapbox Geocoding API for suggestions
    const suggestions = await getLocationSuggestions(query.trim(), {
      north,
      south,
      east,
      west,
    });

    return NextResponse.json({
      suggestions,
      query: query.trim(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get location suggestions using Mapbox Geocoding API
 */
async function getLocationSuggestions(
  query: string,
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): Promise<LocationSuggestion[]> {
  try {
    const { MAPBOX_CONFIG } = await import('@/lib/maps/mapbox-config');

    if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
      throw new Error('Mapbox access token not configured');
    }

    const params = new URLSearchParams({
      access_token: MAPBOX_CONFIG.ACCESS_TOKEN,
      country: MAPBOX_CONFIG.GEOCODING.country,
      types: 'address,poi,place',
      limit: '10',
      autocomplete: 'true',
    });

    // Add bounds if provided
    if (bounds && bounds.north && bounds.south && bounds.east && bounds.west) {
      params.append(
        'bbox',
        `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`
      );
    }

    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return [];
    }

    // Transform Mapbox results to our format
    return data.features.map((feature: any, index: number) => {
      const [lng, lat] = feature.center;
      const placeType = feature.place_type?.[0] || 'address';

      return {
        id: `suggestion-${index}`,
        name: feature.text || feature.place_name,
        location: { lat, lng },
        type: mapPlaceTypeToSuggestionType(placeType),
        formatted_address: feature.place_name,
      };
    });
  } catch (error) {
    return [];
  }
}

/**
 * Map Mapbox place types to our suggestion types
 */
function mapPlaceTypeToSuggestionType(
  placeType: string
): 'address' | 'poi' | 'city' {
  switch (placeType) {
    case 'address':
      return 'address';
    case 'poi':
      return 'poi';
    case 'place':
    case 'region':
    case 'district':
      return 'city';
    default:
      return 'address';
  }
}
