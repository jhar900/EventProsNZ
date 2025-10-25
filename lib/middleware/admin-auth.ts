import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

/**
 * Middleware for comprehensive admin authorization
 * Provides centralized admin access control with audit logging
 */
export async function validateAdminAccess(request: NextRequest) {
  try {
    const { supabase } = createClient(request);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    // Get user role with additional security checks
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status, is_verified, last_login')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
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

    return {
      success: true,
      user: {
        id: user.id,
        role: userData.role,
        status: userData.status,
        is_verified: userData.is_verified,
        last_login: userData.last_login,
      },
      supabase,
    };
  } catch (error) {
    console.error('Admin auth validation error:', error);
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
    console.error('Error checking suspicious activity:', error);
    return false; // Fail open for now, but log the error
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
    console.error('Rate limiting error:', error);
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
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failures shouldn't break the operation
  }
}
