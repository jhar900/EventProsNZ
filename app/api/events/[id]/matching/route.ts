import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  GetEventMatchingRequest,
  EventMatchingResponse,
  ContractorMatch,
} from '@/types/events';

// Validation schemas
const getMatchingSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  serviceCategory: z.string().optional(),
});

// GET /api/events/[id]/matching - Get contractor matches for event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = getMatchingSchema.safeParse({
      eventId,
      ...queryParams,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { serviceCategory } = validationResult.data;

    // Check if event exists and user has access
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(
        `
        event_manager_id,
        event_type,
        location_data,
        attendee_count,
        event_date,
        event_service_requirements (*)
      `
      )
      .eq('id', eventId)
      .single();

    if (eventError) {
      if (eventError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Event not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch event' },
        { status: 500 }
      );
    }

    // Check permissions
    if (event.event_manager_id !== user.id) {
      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userProfile || userProfile.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Get service requirements for matching
    const serviceRequirements = event.event_service_requirements || [];
    const categoriesToMatch = serviceCategory
      ? [serviceCategory]
      : serviceRequirements.map(req => req.service_category);

    if (categoriesToMatch.length === 0) {
      return NextResponse.json({
        matches: [],
        success: true,
        message: 'No service requirements found for matching',
      });
    }

    // Find matching contractors
    const { data: contractors, error: contractorsError } = await supabase
      .from('business_profiles')
      .select(
        `
        *,
        users!business_profiles_user_id_fkey (
          id,
          email,
          is_verified
        ),
        services (*),
        contractor_testimonials (*)
      `
      )
      .eq('is_verified', true)
      .overlaps('service_categories', categoriesToMatch);

    if (contractorsError) {
      console.error('Error fetching contractors:', contractorsError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch contractors' },
        { status: 500 }
      );
    }

    // Calculate match scores and create matches
    const matches: ContractorMatch[] = contractors.map(contractor => {
      // Calculate match score based on various factors
      let matchScore = 0.5; // Base score

      // Service category match
      const matchingCategories = contractor.service_categories.filter(cat =>
        categoriesToMatch.includes(cat)
      );
      matchScore +=
        (matchingCategories.length / categoriesToMatch.length) * 0.3;

      // Rating factor
      if (contractor.average_rating > 0) {
        matchScore += (contractor.average_rating / 5) * 0.2;
      }

      // Review count factor (more reviews = higher confidence)
      const reviewCount = contractor.review_count || 0;
      if (reviewCount > 0) {
        matchScore += Math.min(reviewCount / 50, 1) * 0.1; // Cap at 50 reviews
      }

      // Location factor (if event has location data)
      if (event.location_data && contractor.service_areas) {
        const eventLocation = event.location_data;
        const hasLocationMatch = contractor.service_areas.some(
          area =>
            area
              .toLowerCase()
              .includes(eventLocation.city?.toLowerCase() || '') ||
            area
              .toLowerCase()
              .includes(eventLocation.region?.toLowerCase() || '')
        );
        if (hasLocationMatch) {
          matchScore += 0.1;
        }
      }

      // Cap score at 1.0
      matchScore = Math.min(matchScore, 1.0);

      // Calculate estimated price range from services
      const relevantServices = contractor.services.filter(service =>
        categoriesToMatch.includes(service.service_type)
      );

      let estimatedPrice = { min: 0, max: 0 };
      if (relevantServices.length > 0) {
        const prices = relevantServices.map(service => ({
          min: service.price_range_min || 0,
          max: service.price_range_max || 0,
        }));

        estimatedPrice = {
          min: Math.min(...prices.map(p => p.min)),
          max: Math.max(...prices.map(p => p.max)),
        };
      }

      return {
        contractorId: contractor.user_id,
        contractorName: contractor.company_name,
        serviceCategory: matchingCategories[0] || categoriesToMatch[0],
        matchScore: Math.round(matchScore * 100) / 100,
        estimatedPrice,
        availability: true, // TODO: Implement availability checking
        rating: contractor.average_rating || 0,
        reviewCount: contractor.review_count || 0,
      };
    });

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Save matches to database
    const matchInserts = matches.map(match => ({
      event_id: eventId,
      contractor_id: match.contractorId,
      service_requirement_id: serviceRequirements.find(
        req => req.service_category === match.serviceCategory
      )?.id,
      match_score: match.matchScore,
      status: 'pending' as const,
    }));

    const { error: insertError } = await supabase
      .from('event_contractor_matches')
      .upsert(matchInserts, {
        onConflict: 'event_id,contractor_id,service_requirement_id',
        ignoreDuplicates: false,
      });

    if (insertError) {
      console.error('Error saving matches:', insertError);
      // Don't fail the request, just log the error
    }

    const response: EventMatchingResponse = {
      matches,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/events/[id]/matching:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
