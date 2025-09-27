import { NextRequest, NextResponse } from 'next/server';
import { matchingService } from '@/lib/matching/matching-service';
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
    const contractor_id = searchParams.get('contractor_id');
    const event_date = searchParams.get('event_date');
    const duration = parseInt(searchParams.get('duration') || '8');

    if (!contractor_id || !event_date) {
      return NextResponse.json(
        { error: 'Contractor ID and event date are required' },
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

    const availability = await matchingService.checkAvailability(
      contractor_id,
      event_date,
      duration
    );

    return NextResponse.json(availability);
  } catch (error) {
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
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const body = await request.json();
    const { contractor_ids, event_date, duration } = body;

    if (!contractor_ids || !Array.isArray(contractor_ids) || !event_date) {
      return NextResponse.json(
        { error: 'Contractor IDs array and event date are required' },
        { status: 400 }
      );
    }

    // Authorize access to all contractors
    await Promise.all(
      contractor_ids.map((contractorId: string) =>
        authorizeContractorAccess(supabase, contractorId, user.id, user.role)
      )
    );

    const availabilityResults = await Promise.all(
      contractor_ids.map(async (contractorId: string) => {
        return await matchingService.checkAvailability(
          contractorId,
          event_date,
          duration || 8
        );
      })
    );

    return NextResponse.json({
      availability: availabilityResults,
    });
  } catch (error) {
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
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
