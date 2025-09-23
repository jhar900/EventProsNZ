/**
 * Proximity Search API
 * GET /api/map/proximity/search - Search contractors with location-based filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapService } from '@/lib/maps/map-service';

export interface ProximitySearchResult {
  id: string;
  company_name: string;
  business_address: string;
  service_type: string;
  location: {
    lat: number;
    lng: number;
  };
  is_verified: boolean;
  subscription_tier: string;
  distance?: number;
  relevance_score: number;
}

export interface ProximitySearchResponse {
  results: ProximitySearchResult[];
  total: number;
  query: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = searchParams.get('q');
    const lat = searchParams.get('lat')
      ? parseFloat(searchParams.get('lat')!)
      : null;
    const lng = searchParams.get('lng')
      ? parseFloat(searchParams.get('lng')!)
      : null;
    const radius = searchParams.get('radius')
      ? parseFloat(searchParams.get('radius')!)
      : 50;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: query || '',
      });
    }

    const supabase = createClient();
    const searchQuery = `%${query.trim()}%`;

    // Build search query
    const dbQuery = supabase
      .from('business_profiles')
      .select(
        `
        user_id,
        company_name,
        business_address,
        description,
        is_verified,
        subscription_tier,
        users!inner(
          id,
          role
        ),
        services!inner(
          service_type,
          description
        )
      `
      )
      .eq('users.role', 'contractor')
      .not('business_address', 'is', null)
      .or(
        `company_name.ilike.${searchQuery},description.ilike.${searchQuery},services.service_type.ilike.${searchQuery}`
      );

    const { data: contractors, error } = await dbQuery;

    if (error) {
      console.error('Error searching contractors:', error);
      return NextResponse.json(
        { error: 'Failed to search contractors' },
        { status: 500 }
      );
    }

    // Process results with location filtering
    const results: ProximitySearchResult[] = [];

    for (const contractor of contractors || []) {
      if (!contractor.business_address) continue;

      // Geocode contractor address
      const contractorLocation = await mapService.geocodeAddress(
        contractor.business_address
      );

      if (!contractorLocation) continue;

      // Calculate distance if location provided
      let distance: number | undefined;
      if (lat && lng) {
        distance = calculateDistance({ lat, lng }, contractorLocation);

        // Filter by radius if specified
        if (distance > radius) {
          continue;
        }
      }

      // Calculate relevance score based on text matching
      const relevanceScore = calculateRelevanceScore(
        query.trim(),
        contractor.company_name,
        contractor.description || '',
        contractor.services?.[0]?.service_type || ''
      );

      results.push({
        id: contractor.user_id,
        company_name: contractor.company_name,
        business_address: contractor.business_address,
        service_type: contractor.services?.[0]?.service_type || 'other',
        location: contractorLocation,
        is_verified: contractor.is_verified,
        subscription_tier: contractor.subscription_tier,
        distance,
        relevance_score: relevanceScore,
      });
    }

    // Sort by relevance score and distance
    results.sort((a, b) => {
      // First by relevance score (higher is better)
      if (a.relevance_score !== b.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      // Then by distance (closer is better) if available
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

    return NextResponse.json({
      results,
      total: results.length,
      query: query.trim(),
      location: lat && lng ? { lat, lng } : undefined,
      radius: lat && lng ? radius : undefined,
    });
  } catch (error) {
    console.error('Proximity search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate relevance score based on text matching
 */
function calculateRelevanceScore(
  query: string,
  companyName: string,
  description: string,
  serviceType: string
): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Company name exact match (highest priority)
  if (companyName.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Service type match
  if (serviceType.toLowerCase().includes(queryLower)) {
    score += 8;
  }

  // Description match
  if (description.toLowerCase().includes(queryLower)) {
    score += 5;
  }

  // Word boundary matches (bonus points)
  const words = queryLower.split(' ');
  words.forEach(word => {
    if (companyName.toLowerCase().includes(word)) {
      score += 2;
    }
    if (serviceType.toLowerCase().includes(word)) {
      score += 1.5;
    }
    if (description.toLowerCase().includes(word)) {
      score += 1;
    }
  });

  return Math.min(score, 20); // Cap at 20
}
