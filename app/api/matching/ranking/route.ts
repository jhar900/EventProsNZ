import { NextRequest, NextResponse } from 'next/server';
import { matchingService } from '@/lib/matching/matching-service';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest, handleAuthError } from '@/lib/middleware/auth';
import {
  authorizeEventAccess,
  handleAuthzError,
} from '@/lib/middleware/authorization';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    const algorithm = searchParams.get('algorithm') || 'default';

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Authorize access to the event
    await authorizeEventAccess(supabase, event_id, user.id);

    // Get contractor matches for the event
    const { data: matches, error } = await supabase
      .from('contractor_matches')
      .select('*')
      .eq('event_id', event_id)
      .order('overall_score', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to get contractor matches' },
        { status: 500 }
      );
    }

    const ranking = await matchingService.rankContractors(
      matches || [],
      algorithm
    );

    return NextResponse.json({
      ranking,
      algorithm,
    });
  } catch (error) {
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
      { error: 'Failed to calculate ranking' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const body = await request.json();
    const { matches, algorithm = 'default' } = body;

    if (!matches || !Array.isArray(matches)) {
      return NextResponse.json(
        { error: 'Matches array is required' },
        { status: 400 }
      );
    }

    const ranking = await matchingService.rankContractors(matches, algorithm);

    return NextResponse.json({
      ranking,
      algorithm,
    });
  } catch (error) {
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
      { error: 'Failed to calculate ranking' },
      { status: 500 }
    );
  }
}
