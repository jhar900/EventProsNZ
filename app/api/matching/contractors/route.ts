import { NextRequest, NextResponse } from 'next/server';
import { matchingService } from '@/lib/matching/matching-service';
import { MatchingRequest } from '@/types/matching';
import { authenticateRequest, handleAuthError } from '@/lib/middleware/auth';
import {
  authorizeMatchingAccess,
  handleAuthzError,
} from '@/lib/middleware/authorization';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'score';
    const algorithm = searchParams.get('algorithm') || 'default';

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Authorize access to the event
    await authorizeMatchingAccess(supabase, event_id, user.id);

    const matchingRequest: MatchingRequest = {
      event_id,
      page,
      limit,
      algorithm,
      filters: {
        sort_by: sort as any,
        sort_order: 'desc',
      },
    };

    const result = await matchingService.findMatches(matchingRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in contractor matching API:', error);

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
      { error: 'Failed to find contractor matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const body = await request.json();
    const {
      event_id,
      filters,
      page = 1,
      limit = 20,
      algorithm = 'default',
    } = body;

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Authorize access to the event
    await authorizeMatchingAccess(supabase, event_id, user.id);

    const matchingRequest: MatchingRequest = {
      event_id,
      filters,
      page,
      limit,
      algorithm,
    };

    const result = await matchingService.findMatches(matchingRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in contractor matching API:', error);

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
      { error: 'Failed to find contractor matches' },
      { status: 500 }
    );
  }
}
