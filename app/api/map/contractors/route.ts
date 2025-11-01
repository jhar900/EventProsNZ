/**
 * Map Contractors API
 * GET /api/map/contractors - Get contractors within map bounds
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapService } from '@/lib/maps/map-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const north = parseFloat(searchParams.get('north') || '0');
    const south = parseFloat(searchParams.get('south') || '0');
    const east = parseFloat(searchParams.get('east') || '0');
    const west = parseFloat(searchParams.get('west') || '0');
    const serviceType = searchParams.get('service_type');
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const subscriptionTier = searchParams.get('subscription_tier');

    // Validate bounds
    if (!north || !south || !east || !west) {
      return NextResponse.json(
        { error: 'Invalid map bounds provided' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Build the query - get business profiles with addresses
    // Try both location and business_address columns to support different database states
    let query = supabase
      .from('business_profiles')
      .select(
        `
        user_id,
        company_name,
        location,
        is_verified,
        subscription_tier,
        service_categories,
        users!inner(
          id,
          role
        )
      `
      )
      .eq('users.role', 'contractor')
      .not('location', 'is', null);

    // Apply filters
    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    if (subscriptionTier) {
      query = query.eq('subscription_tier', subscriptionTier);
    }

    const { data: contractors, error } = await query;

    if (error) {
      console.error('Error fetching contractors for map:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch contractors',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // If no contractors found, return empty array instead of error
    if (!contractors || contractors.length === 0) {
      return NextResponse.json({
        contractors: [],
        bounds: { north, south, east, west },
        total: 0,
      });
    }

    // Get service types for contractors that need them (if serviceType filter is applied)
    let contractorsWithServices = contractors;
    if (serviceType) {
      // Fetch services for contractors and filter by service type
      const contractorIds = contractors.map(c => c.user_id);
      const { data: servicesData } = await supabase
        .from('services')
        .select('user_id, service_type')
        .in('user_id', contractorIds)
        .eq('service_type', serviceType);

      const matchingContractorIds = new Set(
        servicesData?.map(s => s.user_id) || []
      );

      contractorsWithServices = contractors.filter(c =>
        matchingContractorIds.has(c.user_id)
      );
    }

    // Transform data for map display with geocoding
    const mapContractors = await Promise.all(
      contractorsWithServices.map(async contractor => {
        let location = { lat: -36.8485, lng: 174.7633 }; // Default Auckland fallback

        // Use location field from business_profiles (contains the address)
        // Location is a TEXT field with the address string
        if (contractor.location && typeof contractor.location === 'string') {
          // Geocode the address string to get lat/lng
          const geocodedLocation = await mapService.geocodeAddress(
            contractor.location
          );
          if (geocodedLocation) {
            location = geocodedLocation;
          }
        }

        // Get primary service type from service_categories array or default
        let serviceTypeValue = 'other';
        if (
          contractor.service_categories &&
          Array.isArray(contractor.service_categories) &&
          contractor.service_categories.length > 0
        ) {
          serviceTypeValue = contractor.service_categories[0];
        } else if (serviceType) {
          serviceTypeValue = serviceType;
        }

        return {
          id: contractor.user_id,
          company_name: contractor.company_name || 'Unnamed Business',
          business_address: contractor.location || '', // Use location field as business_address
          service_type: serviceTypeValue,
          location,
          is_verified: contractor.is_verified || false,
          subscription_tier: contractor.subscription_tier || 'essential',
        };
      })
    );

    return NextResponse.json({
      contractors: mapContractors,
      bounds: { north, south, east, west },
      total: mapContractors.length,
    });
  } catch (error) {
    console.error('Map contractors API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
