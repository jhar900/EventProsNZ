/**
 * Map Clusters API
 * GET /api/map/clusters - Get clustered contractors within map bounds
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapService } from '@/lib/maps/map-service';
import { clusterService } from '@/lib/maps/clustering/cluster-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const north = parseFloat(searchParams.get('north') || '0');
    const south = parseFloat(searchParams.get('south') || '0');
    const east = parseFloat(searchParams.get('east') || '0');
    const west = parseFloat(searchParams.get('west') || '0');
    const zoom = parseFloat(searchParams.get('zoom') || '5');
    const serviceType = searchParams.get('service_type');
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const subscriptionTier = searchParams.get('subscription_tier');
    const searchQuery = searchParams.get('search_query');

    // Validate bounds
    if (!north || !south || !east || !west) {
      return NextResponse.json(
        { error: 'Invalid map bounds provided' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Build the query with proper chaining
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

    // Apply filters by chaining properly
    if (serviceType) {
      query = query.eq('services.service_type', serviceType);
    }

    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    if (subscriptionTier) {
      query = query.eq('subscription_tier', subscriptionTier);
    }

    // Apply search query filter
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      query = query.or(
        `company_name.ilike.${searchPattern},business_address.ilike.${searchPattern}`
      );
    }

    const { data: contractors, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
        { status: 500 }
      );
    }

    // Transform data for map display with proper geocoding
    const mapContractors = await Promise.all(
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
          company_name: contractor.company_name,
          business_address: contractor.business_address,
          service_type: contractor.services?.[0]?.service_type || 'other',
          location,
          is_verified: contractor.is_verified,
          subscription_tier: contractor.subscription_tier,
        };
      }) || []
    );

    // Create clusters using the clustering service
    const bounds = { north, south, east, west };
    const filters = {
      service_type: serviceType || undefined,
      verified_only: verifiedOnly || undefined,
      subscription_tier: subscriptionTier || undefined,
      search_query: searchQuery || undefined,
    };

    const clusters = clusterService.createClusters(
      mapContractors,
      zoom,
      bounds,
      filters
    );

    return NextResponse.json({
      clusters,
      pins: mapContractors,
      bounds,
      zoom,
      filters,
      total: mapContractors.length,
      clusterCount: clusters.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
