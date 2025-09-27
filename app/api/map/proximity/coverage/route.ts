/**
 * Proximity Coverage API
 * GET /api/map/proximity/coverage - Get service area coverage for contractor
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface ServiceArea {
  id: string;
  name: string;
  type: 'radius' | 'polygon';
  coordinates: {
    lat: number;
    lng: number;
  }[];
  radius?: number; // in kilometers
  description?: string;
}

export interface CoverageResponse {
  contractor_id: string;
  coverage_areas: ServiceArea[];
  business_location: {
    lat: number;
    lng: number;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const contractorId = searchParams.get('contractor_id');

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get contractor business profile
    const { data: contractor, error } = await supabase
      .from('business_profiles')
      .select(
        `
        user_id,
        company_name,
        business_address,
        service_areas,
        users!inner(
          id,
          role
        )
      `
      )
      .eq('user_id', contractorId)
      .eq('users.role', 'contractor')
      .single();

    if (error || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Get business location
    let businessLocation = null;
    if (contractor.business_address) {
      const { mapService } = await import('@/lib/maps/map-service');
      businessLocation = await mapService.geocodeAddress(contractor.business_address);
    }

    // Generate service areas based on service_areas field
    const coverageAreas = generateServiceAreas(
      contractor.service_areas || [],
      businessLocation,
      contractor.company_name
    );

    return NextResponse.json({
      contractor_id: contractorId,
      coverage_areas: coverageAreas,
      business_location: businessLocation,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate service areas from contractor data
 */
function generateServiceAreas(
  serviceAreas: string[],
  businessLocation: { lat: number; lng: number } | null,
  companyName: string
): ServiceArea[] {
  const areas: ServiceArea[] = [];

  // If no business location, return empty areas
  if (!businessLocation) {
    return areas;
  }

  // Default service area based on business location
  areas.push({
    id: 'default-radius',
    name: `${companyName} Service Area`,
    type: 'radius',
    coordinates: [businessLocation],
    radius: 50, // Default 50km radius
    description: 'Primary service area',
  });

  // Add custom service areas if specified
  serviceAreas.forEach((area, index) => {
    // For now, we'll create radius-based areas
    // In a full implementation, these could be polygon areas
    areas.push({
      id: `custom-area-${index}`,
      name: area,
      type: 'radius',
      coordinates: [businessLocation],
      radius: 25, // Default 25km for custom areas
      description: `Service area: ${area}`,
    });
  });

  return areas;
}
