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

    // Get event budget
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('budget_total')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get contractor pricing
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('price_range_min, price_range_max')
      .eq('user_id', contractor_id);

    if (servicesError) {
      return NextResponse.json(
        { error: 'Failed to get contractor pricing' },
        { status: 500 }
      );
    }

    const contractorPricing =
      services && services.length > 0
        ? {
            min: Math.min(...services.map(s => s.price_range_min || 0)),
            max: Math.max(...services.map(s => s.price_range_max || 1000)),
          }
        : { min: 0, max: 1000 };

    const budgetCompatibility =
      await matchingService.calculateBudgetCompatibility(
        event.budget_total || 0,
        contractorPricing
      );

    return NextResponse.json({
      budget_compatibility: budgetCompatibility,
      score: budgetCompatibility.overall_score,
    });
  } catch (error) {
    console.error('Error in budget compatibility API:', error);

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
      { error: 'Failed to calculate budget compatibility' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const body = await request.json();
    const { event_budget, contractor_pricing } = body;

    if (event_budget === undefined || !contractor_pricing) {
      return NextResponse.json(
        { error: 'Event budget and contractor pricing are required' },
        { status: 400 }
      );
    }

    const budgetCompatibility =
      await matchingService.calculateBudgetCompatibility(
        event_budget,
        contractor_pricing
      );

    return NextResponse.json({
      budget_compatibility: budgetCompatibility,
      score: budgetCompatibility.overall_score,
    });
  } catch (error) {
    console.error('Error in budget compatibility calculation API:', error);

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
      { error: 'Failed to calculate budget compatibility' },
      { status: 500 }
    );
  }
}
