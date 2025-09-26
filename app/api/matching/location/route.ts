import { NextRequest, NextResponse } from 'next/server';
import { matchingService } from '@/lib/matching/matching-service';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest, handleAuthError } from '@/lib/middleware/auth';
import {
  authorizeContractorAccess,
  handleAuthzError,
} from '@/lib/middleware/authorization';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const event_location = searchParams.get('event_location');
    const contractor_id = searchParams.get('contractor_id');

    if (!event_location || !contractor_id) {
      return NextResponse.json(
        { error: 'Event location and Contractor ID are required' },
        { status: 400 }
      );
    }

    // Authorize access to the contractor
    await authorizeContractorAccess(
      supabase,
      contractor_id,
      user.id,
      user.role
    );

    // Get contractor service areas
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('service_areas')
      .eq('user_id', contractor_id)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    const eventLocation = JSON.parse(event_location);
    const contractorServiceAreas = businessProfile.service_areas || [];

    const locationMatch = await matchingService.calculateLocationMatch(
      eventLocation,
      contractorServiceAreas
    );

    return NextResponse.json({
      location_match: locationMatch,
      score: locationMatch.overall_score,
    });
  } catch (error) {
    console.error('Error in location matching API:', error);

    // Handle authentication/authorization errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Contractor not found') ||
        error.message.includes('Access denied'))
    ) {
      if (error.message.includes('Authentication')) {
        return handleAuthError(error);
      }
      return handleAuthzError(error);
    }

    return NextResponse.json(
      { error: 'Failed to calculate location match' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const body = await request.json();
    const { event_location, contractor_service_areas } = body;

    if (!event_location || !contractor_service_areas) {
      return NextResponse.json(
        { error: 'Event location and contractor service areas are required' },
        { status: 400 }
      );
    }

    const locationMatch = await matchingService.calculateLocationMatch(
      event_location,
      contractor_service_areas
    );

    return NextResponse.json({
      location_match: locationMatch,
      score: locationMatch.overall_score,
    });
  } catch (error) {
    console.error('Error in location matching calculation API:', error);

    // Handle authentication/authorization errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Access denied'))
    ) {
      if (error.message.includes('Authentication')) {
        return handleAuthError(error);
      }
      return handleAuthzError(error);
    }

    return NextResponse.json(
      { error: 'Failed to calculate location match' },
      { status: 500 }
    );
  }
}
