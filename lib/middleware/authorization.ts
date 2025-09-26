import { AuthResult } from './auth';

/**
 * Authorizes access to an event by verifying user ownership
 * @param supabase - Supabase client instance
 * @param eventId - The event ID to check access for
 * @param userId - The user ID requesting access
 * @returns Promise<boolean> - True if authorized
 * @throws Error if authorization fails
 */
export async function authorizeEventAccess(
  supabase: any,
  eventId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      throw new Error('Event not found');
    }

    if (event.user_id !== userId) {
      throw new Error('Unauthorized access to event');
    }

    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Authorizes access to contractor data by verifying permissions
 * @param supabase - Supabase client instance
 * @param contractorId - The contractor ID to check access for
 * @param userId - The user ID requesting access
 * @param userRole - The role of the requesting user
 * @returns Promise<boolean> - True if authorized
 * @throws Error if authorization fails
 */
export async function authorizeContractorAccess(
  supabase: any,
  contractorId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  try {
    // Admins can access any contractor
    if (userRole === 'admin') {
      return true;
    }

    // Contractors can access their own data
    if (userRole === 'contractor' && contractorId === userId) {
      return true;
    }

    // Event managers can access contractor data for matching
    if (userRole === 'event_manager') {
      // Check if contractor is visible and active
      const { data: contractor, error } = await supabase
        .from('users')
        .select('id, is_verified')
        .eq('id', contractorId)
        .eq('role', 'contractor')
        .single();

      if (error || !contractor) {
        throw new Error('Contractor not found');
      }

      // Only allow access to verified contractors for event managers
      if (!contractor.is_verified) {
        throw new Error('Contractor not verified');
      }

      return true;
    }

    throw new Error('Insufficient permissions');
  } catch (error) {
    throw error;
  }
}

/**
 * Authorizes access to matching data by verifying event ownership
 * @param supabase - Supabase client instance
 * @param eventId - The event ID for the matching request
 * @param userId - The user ID requesting access
 * @returns Promise<boolean> - True if authorized
 * @throws Error if authorization fails
 */
export async function authorizeMatchingAccess(
  supabase: any,
  eventId: string,
  userId: string
): Promise<boolean> {
  try {
    // First verify event ownership
    await authorizeEventAccess(supabase, eventId, userId);
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Middleware helper to handle authorization errors
 * @param error - The error that occurred
 * @returns Response with appropriate error status
 */
export function handleAuthzError(error: unknown): Response {
  const message =
    error instanceof Error ? error.message : 'Authorization failed';

  if (
    message.includes('Event not found') ||
    message.includes('Contractor not found')
  ) {
    return new Response(JSON.stringify({ error: 'Resource not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (
    message.includes('Unauthorized access') ||
    message.includes('Insufficient permissions')
  ) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (message.includes('Contractor not verified')) {
    return new Response(JSON.stringify({ error: 'Contractor not verified' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Internal server error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
