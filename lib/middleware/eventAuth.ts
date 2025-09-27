import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export interface EventAccessResult {
  hasAccess: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  event?: any;
}

export interface AuthContext {
  user: any;
  eventId: string;
  requiredRole?: 'event_manager' | 'admin';
}

/**
 * Centralized authorization middleware for event access control
 * Provides consistent authorization logic across all event endpoints
 */
export class EventAuthService {
  /**
   * Validates if a user has access to an event
   * @param eventId - The event ID to check access for
   * @param userId - The user ID requesting access
   * @param requiredRole - Optional role requirement
   * @returns Promise<EventAccessResult>
   */
  static async validateEventAccess(
    eventId: string,
    userId: string,
    requiredRole?: 'event_manager' | 'admin'
  ): Promise<EventAccessResult> {
    try {
      const supabase = await createClient();

      // Get user profile to check role
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !userProfile) {
        return { hasAccess: false, isAdmin: false, isOwner: false };
      }

      const isAdmin = userProfile.role === 'admin';

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('event_manager_id, status')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        return { hasAccess: false, isAdmin, isOwner: false };
      }

      const isOwner = event.event_manager_id === userId;

      // Check access based on role requirements
      let hasAccess = false;

      if (requiredRole === 'admin') {
        hasAccess = isAdmin;
      } else if (requiredRole === 'event_manager') {
        hasAccess = isOwner || isAdmin;
      } else {
        // Default: owner or admin
        hasAccess = isOwner || isAdmin;
      }

      return {
        hasAccess,
        isAdmin,
        isOwner,
        event,
      };
    } catch (error) {
      console.error('Error in validateEventAccess:', error);
      return { hasAccess: false, isAdmin: false, isOwner: false };
    }
  }

  /**
   * Validates admin access for a user
   * @param userId - The user ID to check
   * @returns Promise<boolean>
   */
  static async validateAdminAccess(userId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !userProfile) {
        return false;
      }

      return userProfile.role === 'admin';
    } catch (error) {
      console.error('Error in validateAdminAccess:', error);
      return false;
    }
  }

  /**
   * Validates event manager access for a user
   * @param userId - The user ID to check
   * @returns Promise<boolean>
   */
  static async validateEventManagerAccess(userId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !userProfile) {
        return false;
      }

      return ['event_manager', 'admin'].includes(userProfile.role);
    } catch (error) {
      console.error('Error in validateEventManagerAccess:', error);
      return false;
    }
  }

  /**
   * Middleware wrapper for event authorization
   * @param handler - The API handler function
   * @param options - Authorization options
   * @returns Wrapped handler with authorization
   */
  static withEventAuth(
    handler: (
      req: NextRequest,
      context: any,
      authContext: AuthContext
    ) => Promise<Response>,
    options: {
      requiredRole?: 'event_manager' | 'admin';
      requireOwnership?: boolean;
    } = {}
  ) {
    return async (req: NextRequest, context: { params: { id: string } }) => {
      try {
        const supabase = await createClient();

        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return new Response(
            JSON.stringify({ success: false, message: 'Unauthorized' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const eventId = context.params.id;

        // Validate event access
        const accessResult = await this.validateEventAccess(
          eventId,
          user.id,
          options.requiredRole
        );

        if (!accessResult.hasAccess) {
          return new Response(
            JSON.stringify({ success: false, message: 'Access denied' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Check ownership requirement
        if (
          options.requireOwnership &&
          !accessResult.isOwner &&
          !accessResult.isAdmin
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Access denied - ownership required',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Create auth context
        const authContext: AuthContext = {
          user,
          eventId,
          requiredRole: options.requiredRole,
        };

        // Call the original handler with auth context
        return await handler(req, context, authContext);
      } catch (error) {
        console.error('Error in withEventAuth middleware:', error);
        return new Response(
          JSON.stringify({ success: false, message: 'Internal server error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    };
  }
}

/**
 * Utility function to get authenticated user from request
 * @param req - NextRequest object
 * @returns Promise<{ user: any; error: string | null }>
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<{ user: any; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, error: 'Unauthorized' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error);
    return { user: null, error: 'Authentication failed' };
  }
}
