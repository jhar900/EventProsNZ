import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
// Email import removed - using dynamic import to avoid blocking route registration

const googleAuthSchema = z.object({
  id_token: z.string().min(1, 'ID token is required'),
  role: z.enum(['event_manager', 'contractor']).optional(),
});

// Test GET handler
export async function GET() {
  return NextResponse.json({ message: 'Google OAuth route is working' });
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/auth/google called');
    const body = await request.json();
    console.log('Request body received:', {
      hasIdToken: !!body.id_token,
      role: body.role,
    });
    const validatedData = googleAuthSchema.parse(body);

    const { id_token, role = 'event_manager' } = validatedData;

    // Verify and create user with Google ID token
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      });

    if (authError) {
      return NextResponse.json(
        { error: 'Google authentication failed', details: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Check if user already exists in our database
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, is_verified')
      .eq('id', authData.user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      return NextResponse.json(
        { error: 'Failed to check user status' },
        { status: 500 }
      );
    }

    if (existingUser) {
      // User exists, update last login and return user data
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

      // Get full user profile
      const { data: userData, error: profileError } = await supabaseAdmin
        .from('users')
        .select(
          `
          id,
          email,
          role,
          is_verified,
          last_login,
          profiles (
            first_name,
            last_name,
            avatar_url,
            timezone
          )
        `
        )
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to fetch user profile' },
          { status: 500 }
        );
      }

      // Create JSON response
      const jsonResponse = NextResponse.json({
        message: 'Login successful',
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          is_verified: userData.is_verified,
          last_login: userData.last_login,
          profile: userData.profiles,
        },
      });

      // Set session cookies if we have a session
      if (authData.session) {
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
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
          });

          // Now apply all tracked cookies to the JSON response
          console.log('Setting session cookies:', {
            count: trackedCookies.length,
            names: trackedCookies.map(c => c.name),
            details: trackedCookies.map(c => ({
              name: c.name,
              hasValue: !!c.value,
              path: c.options?.path,
              httpOnly: c.options?.httpOnly,
              secure: c.options?.secure,
              sameSite: c.options?.sameSite,
            })),
          });

          trackedCookies.forEach(({ name, value, options }) => {
            // For localhost, secure must be false, otherwise cookies won't be set
            const isLocalhost = request.headers
              .get('host')
              ?.includes('localhost');
            const cookieOptions = {
              path: options.path || '/',
              domain: options.domain,
              maxAge: options.maxAge || 60 * 60 * 24 * 7, // Default to 7 days if not specified
              httpOnly: options.httpOnly ?? true,
              secure: isLocalhost
                ? false
                : (options.secure ?? process.env.NODE_ENV === 'production'),
              sameSite:
                (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
            };
            jsonResponse.cookies.set(name, value, cookieOptions);
            console.log(`Set cookie: ${name}`, cookieOptions);
          });
        } catch (cookieError) {
          console.error('Failed to set session cookies:', cookieError);
          // Don't fail the request, but log the error
        }
      } else {
        console.warn('No session data available to set cookies');
      }

      return jsonResponse;
    }

    // New user - create user record
    // Use service role client which should bypass RLS
    // If RLS still blocks, we'll use a database function or direct SQL
    const { error: createUserError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        role,
        is_verified: true, // Google users are pre-verified
        last_login: new Date().toISOString(),
      });

    if (createUserError) {
      console.error('Failed to create user:', createUserError);

      // If RLS is blocking, try using RPC call or direct SQL
      // This is a fallback if the service role isn't bypassing RLS properly
      if (createUserError.code === '42501') {
        // Try using a database function that bypasses RLS
        const { error: rpcError } = await supabaseAdmin.rpc(
          'create_user_profile',
          {
            user_id: authData.user.id,
            user_email: authData.user.email!,
            user_role: role,
          }
        );

        if (rpcError) {
          return NextResponse.json(
            {
              error: 'Failed to create user profile',
              details: createUserError.message,
              code: createUserError.code,
              hint: 'RLS policy violation. Please run the migration to fix RLS policies.',
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: 'Failed to create user profile',
            details: createUserError.message,
            code: createUserError.code,
            hint: createUserError.hint,
          },
          { status: 500 }
        );
      }
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        first_name:
          authData.user.user_metadata?.full_name?.split(' ')[0] || 'User',
        last_name:
          authData.user.user_metadata?.full_name
            ?.split(' ')
            .slice(1)
            .join(' ') || '',
        avatar_url: authData.user.user_metadata?.avatar_url,
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
          company_name: `${authData.user.user_metadata?.full_name || 'User'} Services`,
          subscription_tier: 'essential',
        });

      if (businessProfileError) {
        // Don't fail registration for business profile creation error
      }
    }

    // Extract user name from metadata
    const fullName = authData.user.user_metadata?.full_name || '';
    const firstName = fullName.split(' ')[0] || 'User';
    const lastName = fullName.split(' ').slice(1).join(' ') || '';

    // Send welcome email (non-blocking - don't fail registration if email fails)
    // Use dynamic import to avoid blocking route registration
    import('@/lib/email/welcome-email')
      .then(({ sendWelcomeEmail }) => {
        sendWelcomeEmail({
          userId: authData.user.id,
          email: authData.user.email!,
          firstName,
          lastName,
          role,
        }).catch(error => {
          // Log error but don't throw - registration should succeed even if email fails
          console.error(
            'Failed to send welcome email during Google OAuth registration:',
            error
          );
        });
      })
      .catch(() => {
        // Silently fail if email module can't be loaded
      });

    // Create JSON response
    const jsonResponse = NextResponse.json({
      message: 'User registered and logged in successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
        is_verified: true,
        last_login: new Date().toISOString(),
        profile: {
          first_name:
            authData.user.user_metadata?.full_name?.split(' ')[0] || 'User',
          last_name:
            authData.user.user_metadata?.full_name
              ?.split(' ')
              .slice(1)
              .join(' ') || '',
          avatar_url: authData.user.user_metadata?.avatar_url,
          timezone: 'Pacific/Auckland',
        },
      },
    });

    // Set session cookies if we have a session
    if (authData.session) {
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
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        });

        // Now apply all tracked cookies to the JSON response
        console.log('Setting session cookies (new user):', {
          count: trackedCookies.length,
          names: trackedCookies.map(c => c.name),
          details: trackedCookies.map(c => ({
            name: c.name,
            hasValue: !!c.value,
            path: c.options?.path,
            httpOnly: c.options?.httpOnly,
            secure: c.options?.secure,
            sameSite: c.options?.sameSite,
          })),
        });

        trackedCookies.forEach(({ name, value, options }) => {
          // For localhost, secure must be false, otherwise cookies won't be set
          const isLocalhost = request.headers
            .get('host')
            ?.includes('localhost');
          const cookieOptions = {
            path: options.path || '/',
            domain: options.domain,
            maxAge: options.maxAge || 60 * 60 * 24 * 7, // Default to 7 days if not specified
            httpOnly: options.httpOnly ?? true,
            secure: isLocalhost
              ? false
              : (options.secure ?? process.env.NODE_ENV === 'production'),
            sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
          };
          jsonResponse.cookies.set(name, value, cookieOptions);
          console.log(`Set cookie: ${name}`, cookieOptions);
        });
      } catch (cookieError) {
        console.error('Failed to set session cookies:', cookieError);
        // Don't fail the request, but log the error
      }
    } else {
      console.warn('No session data available to set cookies');
    }

    return jsonResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
