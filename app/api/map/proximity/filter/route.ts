/**
 * Proximity Filter API
 * GET /api/map/proximity/filter - Filter contractors by proximity to location
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapService } from '@/lib/maps/map-service';

export interface ProximityContractor {
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
  distance?: number; // in kilometers
}

export interface ProximityFilterResponse {
  contractors: ProximityContractor[];
  total: number;
  location: {
    lat: number;
    lng: number;
  };
  radius: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '50'); // Default 50km
    const serviceType = searchParams.get('service_type');
    const verifiedOnly = searchParams.get('verified_only') === 'true';

    // Validate location
    if (!lat || !lng || lat === 0 || lng === 0) {
      return NextResponse.json(
        { error: 'Valid location coordinates required' },
        { status: 400 }
      );
    }

    // Validate radius (max 200km)
    if (radius < 1 || radius > 200) {
      return NextResponse.json(
        { error: 'Radius must be between 1 and 200 kilometers' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get all contractors with business addresses
    let query = supabase
      .from('business_profiles')
      .select(
        `
        user_id,
        company_name,
        business_address,
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
      .not('business_address', 'is', null);

    // Apply filters
    if (serviceType) {
      query = query.eq('services.service_type', serviceType);
    }

    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    const { data: contractors, error } = await query;

    if (error) {
      console.error('Error fetching contractors for proximity filter:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
        { status: 500 }
      );
    }

    // Filter contractors by proximity
    const proximityContractors: ProximityContractor[] = [];

    for (const contractor of contractors || []) {
      if (!contractor.business_address) continue;

      // Geocode contractor address
      const contractorLocation = await mapService.geocodeAddress(
        contractor.business_address
      );

      if (!contractorLocation) continue;

      // Calculate distance using Haversine formula
      const distance = calculateDistance({ lat, lng }, contractorLocation);

      // Check if within radius
      if (distance <= radius) {
        proximityContractors.push({
          id: contractor.user_id,
          company_name: contractor.company_name,
          business_address: contractor.business_address,
          service_type: contractor.services?.[0]?.service_type || 'other',
          location: contractorLocation,
          is_verified: contractor.is_verified,
          subscription_tier: contractor.subscription_tier,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
        });
      }
    }

    // Sort by distance (closest first)
    proximityContractors.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return NextResponse.json({
      contractors: proximityContractors,
      total: proximityContractors.length,
      location: { lat, lng },
      radius,
    });
  } catch (error) {
    console.error('Proximity filter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
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
