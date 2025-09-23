/**
 * Contractor Location API
 * GET /api/map/contractors/[id]/location - Get contractor location details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapService } from '@/lib/maps/map-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractorId = params.id;

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

    // Geocode the business address
    let location = { lat: -36.8485, lng: 174.7633 }; // Default fallback

    if (contractor.business_address) {
      const geocodedLocation = await mapService.geocodeAddress(
        contractor.business_address
      );
      if (geocodedLocation) {
        location = geocodedLocation;
      }
    }

    return NextResponse.json({
      location,
      address: contractor.business_address,
      company_name: contractor.company_name,
    });
  } catch (error) {
    console.error('Contractor location API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
