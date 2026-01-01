import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
// Email imports use dynamic imports to avoid blocking route registration

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['event_manager', 'contractor', 'admin']),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/auth/register called');
    // Check if Supabase is properly configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details:
            'Database connection not configured. Please contact support.',
          code: 'CONFIG_ERROR',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const { email, password, role, first_name, last_name } = validatedData;

    // Create user in Supabase Auth
    // Set email_confirm to false so user must verify their email
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Require email verification
      });

    if (authError) {
      return NextResponse.json(
        {
          error: 'Failed to create user account',
          details: authError.message,
          code: authError.status || 'AUTH_ERROR',
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user record in our users table
    // Set is_verified to false - user must verify email first
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email,
      role,
      is_verified: false, // User must verify email
      last_login: new Date().toISOString(),
    });

    if (userError) {
      // Clean up auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile', details: userError.message },
        { status: 500 }
      );
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name,
        last_name,
        timezone: 'Pacific/Auckland',
      });

    if (profileError) {
      // Don't fail registration for profile creation error
    }

    // Create business profile if contractor
    if (role === 'contractor') {
      const { error: businessProfileError } = await supabaseAdmin
        .from('business_profiles')
        .insert({
          user_id: authData.user.id,
          company_name: `${first_name} ${last_name} Services`,
          subscription_tier: 'essential',
        });

      if (businessProfileError) {
        // Don't fail registration for business profile creation error
      }
    }

    // Sign in the user to create a session (so they're automatically logged in)
    const { data: signInData, error: signInError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError || !signInData.session) {
      console.error('Failed to sign in user after registration:', signInError);
      // Don't fail registration, but user will need to log in manually
    }

    // Send email verification email (non-blocking - don't fail registration if email fails)
    // Use dynamic import to avoid blocking route registration
    import('@/lib/email/verification-email')
      .then(({ sendVerificationEmail }) => {
        sendVerificationEmail({
          userId: authData.user.id,
          email,
          firstName: first_name,
        }).catch(error => {
          // Log error but don't throw - registration should succeed even if email fails
          console.error(
            'Failed to send verification email during registration:',
            error
          );
        });
      })
      .catch(() => {
        // Silently fail if email module can't be loaded
      });

    // Send welcome email (non-blocking - don't fail registration if email fails)
    // Use dynamic import to avoid blocking route registration
    // Note: Welcome email will be sent after email verification
    import('@/lib/email/welcome-email')
      .then(({ sendWelcomeEmail }) => {
        sendWelcomeEmail({
          userId: authData.user.id,
          email,
          firstName: first_name,
          lastName: last_name,
          role,
        }).catch(error => {
          // Log error but don't throw - registration should succeed even if email fails
          console.error(
            'Failed to send welcome email during registration:',
            error
          );
        });
      })
      .catch(() => {
        // Silently fail if email module can't be loaded
      });

    // Send admin notification email (non-blocking - don't fail registration if email fails)
    // Use dynamic import to avoid blocking route registration
    import('@/lib/email/admin-notification-email')
      .then(({ sendAdminNotificationEmail }) => {
        sendAdminNotificationEmail({
          userId: authData.user.id,
          email,
          firstName: first_name,
          lastName: last_name,
          role,
        }).catch(error => {
          // Log error but don't throw - registration should succeed even if email fails
          console.error(
            'Failed to send admin notification email during registration:',
            error
          );
        });
      })
      .catch(() => {
        // Silently fail if email module can't be loaded
      });

    // Create JSON response
    const jsonResponse = NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email,
        role,
        first_name,
        last_name,
      },
    });

    // Set session cookies if we have a session (so user is automatically logged in)
    if (signInData?.session) {
      try {
        // Track cookies as they're set
        const trackedCookies: Array<{
          name: string;
          value: string;
          options: any;
        }> = [];

        // Create a custom client that tracks cookies
        const response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return request.cookies.get(name)?.value;
              },
              set(name: string, value: string, options: any) {
                // Track this cookie
                trackedCookies.push({ name, value, options });
                // Also set it on the response
                response.cookies.set(name, value, options);
              },
              remove(name: string, options: any) {
                response.cookies.set(name, '', { ...options, maxAge: 0 });
              },
            },
          }
        );

        // Set the session - this will call set() multiple times
        await supabase.auth.setSession({
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
        });

        // Now apply all tracked cookies to the JSON response
        const isLocalhost = request.headers.get('host')?.includes('localhost');
        trackedCookies.forEach(({ name, value, options }) => {
          const cookieOptions = {
            path: options.path || '/',
            domain: options.domain,
            maxAge: options.maxAge || 60 * 60 * 24 * 7, // Default to 7 days
            httpOnly: options.httpOnly ?? true,
            secure: isLocalhost
              ? false
              : (options.secure ?? process.env.NODE_ENV === 'production'),
            sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
          };
          jsonResponse.cookies.set(name, value, cookieOptions);
        });
      } catch (cookieError) {
        console.error('Failed to set session cookies:', cookieError);
        // Don't fail the request, but log the error
      }
    }

    return jsonResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Check if it's a Supabase connection error
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: 'Unable to connect to the database. Please try again later.',
          code: 'DB_CONNECTION_ERROR',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'An unexpected error occurred'
            : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
