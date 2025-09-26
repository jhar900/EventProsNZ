import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthResult {
  user: AuthenticatedUser;
  supabase: any;
}

/**
 * Authenticates a request by verifying the JWT token from Supabase
 * @param request - The incoming request
 * @returns Promise<AuthResult> - User information and Supabase client
 * @throws Error if authentication fails
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Authentication required');
    }

    // Get user role from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new Error('User profile not found');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email || '',
      role: userData.role,
    };

    return { user: authenticatedUser, supabase };
  } catch (error) {
    throw new Error('Invalid authentication');
  }
}

/**
 * Middleware helper to handle authentication errors
 * @param error - The error that occurred
 * @returns Response with appropriate error status
 */
export function handleAuthError(error: unknown): Response {
  const message =
    error instanceof Error ? error.message : 'Authentication failed';

  if (
    message.includes('Authentication required') ||
    message.includes('Invalid authentication')
  ) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (message.includes('User profile not found')) {
    return new Response(JSON.stringify({ error: 'User profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Internal server error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
