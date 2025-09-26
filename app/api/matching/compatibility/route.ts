import { NextRequest, NextResponse } from 'next/server';
import { matchingService } from '@/lib/matching/matching-service';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest, handleAuthError } from '@/lib/middleware/auth';
import {
  authorizeEventAccess,
  authorizeContractorAccess,
  handleAuthzError,
} from '@/lib/middleware/authorization';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    const contractor_id = searchParams.get('contractor_id');

    if (!event_id || !contractor_id) {
      return NextResponse.json(
        { error: 'Event ID and Contractor ID are required' },
        { status: 400 }
      );
    }

    // Authorize access to the event
    await authorizeEventAccess(supabase, event_id, user.id);

    // Authorize access to the contractor
    await authorizeContractorAccess(
      supabase,
      contractor_id,
      user.id,
      user.role
    );

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get contractor details
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select(
        `
        id,
        business_profiles!inner(*),
        services(*)
      `
      )
      .eq('id', contractor_id)
      .eq('role', 'contractor')
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    const businessProfile = contractor.business_profiles[0];
    const services = contractor.services || [];

    // Calculate compatibility
    const eventRequirements = {
      event_id: event.id,
      event_type: event.event_type || 'general',
      event_date: event.event_date,
      duration_hours: event.duration_hours || 8,
      location: event.location_data || {
        lat: 0,
        lng: 0,
        address: event.location || '',
      },
      budget_total: event.budget_total || 0,
      service_requirements: [], // Would be populated from event_service_requirements table
      special_requirements: event.special_requirements,
    };

    const contractorProfile = {
      contractor_id: contractor.id,
      company_name: businessProfile.company_name,
      service_categories: businessProfile.service_categories || [],
      service_areas: businessProfile.service_areas || [],
      pricing_range:
        services.length > 0
          ? {
              min: Math.min(...services.map(s => s.price_range_min || 0)),
              max: Math.max(...services.map(s => s.price_range_max || 1000)),
            }
          : { min: 0, max: 1000 },
      availability: 'flexible',
      is_verified: businessProfile.is_verified,
      subscription_tier: businessProfile.subscription_tier,
      average_rating: businessProfile.average_rating || 0,
      review_count: businessProfile.review_count || 0,
    };

    const compatibility = await matchingService.calculateCompatibility(
      eventRequirements,
      contractorProfile
    );

    const breakdown = {
      service_type: compatibility.service_type_score,
      experience: compatibility.experience_score,
      pricing: compatibility.pricing_score,
      location: compatibility.location_score,
      performance: compatibility.performance_score,
      availability: compatibility.availability_score,
      total: compatibility.overall_score,
    };

    return NextResponse.json({
      compatibility,
      breakdown,
    });
  } catch (error) {
    console.error('Error in compatibility API:', error);

    // Handle authentication/authorization errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Event not found') ||
        error.message.includes('Contractor not found') ||
        error.message.includes('Access denied'))
    ) {
      if (error.message.includes('Authentication')) {
        return handleAuthError(error);
      }
      return handleAuthzError(error);
    }

    return NextResponse.json(
      { error: 'Failed to calculate compatibility' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const body = await request.json();
    const { event_requirements, contractor_profile } = body;

    if (!event_requirements || !contractor_profile) {
      return NextResponse.json(
        { error: 'Event requirements and contractor profile are required' },
        { status: 400 }
      );
    }

    // For POST requests, we need to validate that the user has access to the event
    if (event_requirements.event_id) {
      await authorizeEventAccess(
        supabase,
        event_requirements.event_id,
        user.id
      );
    }

    const compatibility = await matchingService.calculateCompatibility(
      event_requirements,
      contractor_profile
    );

    const breakdown = {
      service_type: compatibility.service_type_score,
      experience: compatibility.experience_score,
      pricing: compatibility.pricing_score,
      location: compatibility.location_score,
      performance: compatibility.performance_score,
      availability: compatibility.availability_score,
      total: compatibility.overall_score,
    };

    return NextResponse.json({
      compatibility,
      breakdown,
    });
  } catch (error) {
    console.error('Error in compatibility calculation API:', error);

    // Handle authentication/authorization errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('Event not found') ||
        error.message.includes('Access denied'))
    ) {
      if (error.message.includes('Authentication')) {
        return handleAuthError(error);
      }
      return handleAuthzError(error);
    }

    return NextResponse.json(
      { error: 'Failed to calculate compatibility' },
      { status: 500 }
    );
  }
}
