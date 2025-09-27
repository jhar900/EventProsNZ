import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest, handleAuthError } from '@/lib/middleware/auth';
import {
  authorizeEventAccess,
  authorizeContractorAccess,
  handleAuthzError,
} from '@/lib/middleware/authorization';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const body = await request.json();
    const { event_id, contractor_id, message } = body;

    if (!event_id || !contractor_id || !message) {
      return NextResponse.json(
        { error: 'Event ID, Contractor ID, and message are required' },
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

    // Create inquiry
    const { data: inquiry, error } = await supabase
      .from('enquiries')
      .insert({
        event_id,
        contractor_id,
        message,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create inquiry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inquiry,
    });
  } catch (error) {
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
      { error: 'Failed to create inquiry' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, supabase } = await authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    const contractor_id = searchParams.get('contractor_id');

    if (!event_id && !contractor_id) {
      return NextResponse.json(
        { error: 'Event ID or Contractor ID is required' },
        { status: 400 }
      );
    }

    // Authorize access based on what's being queried
    if (event_id) {
      await authorizeEventAccess(supabase, event_id, user.id);
    }
    if (contractor_id) {
      await authorizeContractorAccess(
        supabase,
        contractor_id,
        user.id,
        user.role
      );
    }
    let query = supabase.from('enquiries').select('*');

    if (event_id) {
      query = query.eq('event_id', event_id);
    }

    if (contractor_id) {
      query = query.eq('contractor_id', contractor_id);
    }

    const { data: enquiries, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch enquiries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      enquiries: enquiries || [],
    });
  } catch (error) {
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
      { error: 'Failed to fetch enquiries' },
      { status: 500 }
    );
  }
}
