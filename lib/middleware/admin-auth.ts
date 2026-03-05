import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/server';
import { RateLimitService } from '@/lib/middleware/rateLimit';

/**
 * Middleware for admin authorization.
 *
 * Auth strategies (checked in order):
 * 1. x-admin-token header (for server-to-server use only, requires ADMIN_ACCESS_TOKEN env var)
 * 2. Session cookie (primary method — validates logged-in user has admin role)
 *
 * Always returns supabaseAdmin (service-role client) on success so API routes
 * can bypass RLS to read/write other users' data.
 */
export async function validateAdminAccess(request: NextRequest) {
  try {
    // Strategy 1: Admin token header (server-to-server only)
    const expectedToken = process.env.ADMIN_ACCESS_TOKEN;
    if (expectedToken) {
      const adminToken = request.headers.get('x-admin-token');
      if (adminToken === expectedToken) {
        const { data: adminUsers, error: adminError } = await supabaseAdmin
          .from('users')
          .select('id, email, role, is_verified, status, last_login')
          .eq('role', 'admin')
          .limit(1);

        if (adminUsers && adminUsers.length > 0 && !adminError) {
          return {
            success: true,
            user: {
              id: adminUsers[0].id,
              role: adminUsers[0].role,
              status: adminUsers[0].status || 'active',
              is_verified: adminUsers[0].is_verified,
              last_login: adminUsers[0].last_login,
            },
            supabase: supabaseAdmin,
          };
        }
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Unauthorized - No admin users found' },
            { status: 401 }
          ),
        };
      }
    }

    // Strategy 2: Cookie-based session auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {
            // Not needed for auth validation in API routes
          },
          remove() {
            // Not needed for auth validation in API routes
          },
        },
      }
    );

    // Try getSession first, then fallback to getUser
    let user = null;

    const {
      data: { session: sessionData },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionData?.user) {
      user = sessionData.user;
    } else {
      // Fallback to getUser (handles null session with no error, e.g. chunked cookies)
      const {
        data: { user: userData },
        error: userError,
      } = await supabase.auth.getUser();

      if (userData && !userError) {
        user = userData;
      } else {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          ),
        };
      }
    }

    if (!user) {
      return {
        success: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    // Verify admin role using service-role client (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
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

    if (userData.role !== 'admin') {
      // Log unauthorized access attempt
      await supabaseAdmin.from('activity_logs').insert({
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

    if (userData.status !== 'active') {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Account not active' },
          { status: 403 }
        ),
      };
    }

    const suspiciousActivity = await checkSuspiciousActivity(user.id);
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
      supabase: supabaseAdmin,
    };
  } catch (error) {
    console.error(
      '[Admin Auth] Unexpected error:',
      error instanceof Error ? error.message : String(error)
    );
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
async function checkSuspiciousActivity(userId: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentFailures } = await supabaseAdmin
      .from('activity_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('action', 'login_failed')
      .gte('created_at', oneHourAgo);

    if (recentFailures && recentFailures.length > 5) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
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

/**
 * Rate limit check for admin endpoints.
 * Returns true if the request is allowed, false if rate limited.
 */
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string
): Promise<boolean> {
  const result = RateLimitService.checkRateLimit(request, endpoint);
  return result.allowed;
}
