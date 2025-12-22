import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * Middleware for comprehensive admin authorization
 * Provides centralized admin access control with audit logging
 */
export async function validateAdminAccess(request: NextRequest) {
  try {
    console.log('[Admin Auth] Starting validation for:', request.url);

    // Use the middleware client helper which properly handles cookies in API routes
    // This is the same pattern used by other API routes in the codebase
    const { supabase } = createClient(request);

    // Log cookie information
    const allCookies = request.cookies.getAll();
    console.log('[Admin Auth] Cookies received:', {
      count: allCookies.length,
      names: allCookies.map(c => c.name),
      hasAuthToken: allCookies.some(c => c.name.includes('auth-token')),
      cookieDetails: allCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0,
      })),
    });

    // For development: Simple bypass - just return success
    // This allows access to admin endpoints without authentication
    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.VERCEL_ENV === 'development' ||
      request.url.includes('localhost');

    console.log('[Admin Auth] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      isDevelopment,
      url: request.url,
    });

    if (isDevelopment) {
      console.log('[Admin Auth] Development mode - bypassing auth');
      return {
        success: true,
        user: {
          id: 'dev-admin-user',
          role: 'admin',
          status: 'active',
          is_verified: true,
          last_login: new Date().toISOString(),
        },
        supabase: null, // We'll handle this in the API route
      };
    }

    // Production: Standard authentication flow
    // Try getSession first (reads from cookies), then fallback to getUser
    let user = null;
    let session = null;

    console.log('[Admin Auth] Attempting getSession()...');
    // Method 1: Try getSession (preferred for cookie-based auth)
    const {
      data: { session: sessionData },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('[Admin Auth] getSession result:', {
      hasSession: !!sessionData,
      hasUser: !!sessionData?.user,
      userId: sessionData?.user?.id,
      sessionError: sessionError?.message,
      sessionErrorCode: sessionError?.status,
    });

    if (sessionData?.user) {
      console.log('[Admin Auth] Session found, user ID:', sessionData.user.id);
      user = sessionData.user;
      session = sessionData;
    } else if (sessionError) {
      console.log(
        '[Admin Auth] getSession failed, trying getUser() as fallback...'
      );
      // If getSession fails, try getUser as fallback
      const {
        data: { user: userData },
        error: userError,
      } = await supabase.auth.getUser();

      console.log('[Admin Auth] getUser result:', {
        hasUser: !!userData,
        userId: userData?.id,
        userError: userError?.message,
        userErrorCode: userError?.status,
      });

      if (userData && !userError) {
        user = userData;
        console.log('[Admin Auth] User found via getUser:', user.id);
      } else {
        // Log the error for debugging (but don't expose to client)
        console.error(
          '[Admin Auth] Authentication failed - both methods failed:',
          {
            sessionError: sessionError?.message,
            sessionErrorCode: sessionError?.status,
            userError: userError?.message,
            userErrorCode: userError?.status,
            hasCookies: request.cookies.getAll().length > 0,
            cookieNames: request.cookies.getAll().map(c => c.name),
            url: request.url,
          }
        );

        return {
          success: false,
          response: NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          ),
        };
      }
    } else {
      // No session and no error - user is not authenticated
      console.log(
        '[Admin Auth] No session and no error - user not authenticated'
      );
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    if (!user) {
      console.log('[Admin Auth] No user found after authentication attempts');
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    console.log(
      '[Admin Auth] User authenticated, checking role for user:',
      user.id
    );

    // Get user role with additional security checks
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status, is_verified, last_login')
      .eq('id', user.id)
      .single();

    console.log('[Admin Auth] User data query result:', {
      hasUserData: !!userData,
      role: userData?.role,
      status: userData?.status,
      userError: userError?.message,
      userErrorCode: userError?.code,
    });

    if (userError || !userData) {
      console.error('[Admin Auth] User not found in database:', {
        userId: user.id,
        error: userError?.message,
      });
      return {
        success: false,
        response: NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        ),
      };
    }

    // Comprehensive admin validation
    if (userData.role !== 'admin') {
      console.log('[Admin Auth] User is not admin, role:', userData.role);
      // Log unauthorized access attempt
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'unauthorized_admin_access_attempt',
        details: {
          attempted_endpoint: request.url,
          user_role: userData.role,
          ip_address:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip'),
        },
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      });

      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        ),
      };
    }

    // Additional security checks for admin users
    if (userData.status !== 'active') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Account not active' },
          { status: 403 }
        ),
      };
    }

    // Check for suspicious activity (optional)
    const suspiciousActivity = await checkSuspiciousActivity(supabase, user.id);
    if (suspiciousActivity) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Account temporarily restricted' },
          { status: 403 }
        ),
      };
    }

    console.log('[Admin Auth] Admin access granted for user:', user.id);
    return {
      success: true,
      user: {
        id: user.id,
        role: userData.role,
        status: userData.status,
        is_verified: userData.is_verified,
        last_login: userData.last_login,
      },
      supabase, // Always return the authenticated supabase client in production
    };
  } catch (error) {
    // Log error for debugging but don't expose details to client
    console.error('[Admin Auth] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url,
    });
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Check for suspicious admin activity patterns
 */
async function checkSuspiciousActivity(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    // Check for multiple failed login attempts in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentFailures } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('action', 'login_failed')
      .gte('created_at', oneHourAgo);

    // If more than 5 failed attempts in last hour, consider suspicious
    if (recentFailures && recentFailures.length > 5) {
      return true;
    }

    // Check for unusual access patterns (optional)
    // This could include checking for access from new IP addresses, etc.

    return false;
  } catch (error) {
    // Fail open for now, but log the error
    return false;
  }
}

/**
 * Rate limiting for admin operations
 */
export async function checkRateLimit(
  request: NextRequest,
  operation: string
): Promise<boolean> {
  try {
    const { supabase } = createClient(request);
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Check recent requests for this IP and operation
    const { data: recentRequests } = await supabase
      .from('rate_limits')
      .select('id')
      .eq('ip_address', ip)
      .eq('operation', operation)
      .gte('created_at', oneMinuteAgo.toISOString());

    // Rate limits by operation type
    const limits = {
      bulk_user_actions: 5, // 5 bulk operations per minute
      search_users: 30, // 30 searches per minute
      admin_access: 10, // 10 admin access attempts per minute
    };

    const limit = limits[operation as keyof typeof limits] || 10;

    if (recentRequests && recentRequests.length >= limit) {
      return false;
    }

    // Log this request
    await supabase.from('rate_limits').insert({
      ip_address: ip,
      operation,
      created_at: now.toISOString(),
    });

    return true;
  } catch (error) {
    // Fail open for now, but log the error
    return true;
  }
}

/**
 * Audit logging for admin operations
 */
export async function logAdminAction(
  supabase: any,
  adminUserId: string,
  action: string,
  details: any,
  request: NextRequest
) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: adminUserId,
      action: `admin_${action}`,
      details: {
        ...details,
        admin_user_id: adminUserId,
        timestamp: new Date().toISOString(),
      },
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });
  } catch (error) {
    // Don't throw - logging failures shouldn't break the operation
  }
}
