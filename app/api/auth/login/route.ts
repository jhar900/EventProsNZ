import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;
    // Authenticate user with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error('[Login API] Authentication error:', {
        email,
        error: authError.message,
        code: authError.status,
      });

      // If email is not confirmed, send verification email automatically
      if (
        authError.message.includes('Email not confirmed') ||
        authError.message.includes('email_not_confirmed')
      ) {
        // Check if user exists
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('id, email, profiles(first_name)')
          .eq('email', email)
          .maybeSingle();

        let verificationEmailSent = false;
        let emailError = null;

        if (userData) {
          // Use custom styled verification email (matches other emails like team invitations)
          try {
            const { sendVerificationEmail } = await import(
              '@/lib/email/verification-email'
            );
            const emailResult = await sendVerificationEmail({
              userId: userData.id,
              email: userData.email,
              firstName: (userData.profiles as any)?.first_name || 'User',
            });

            if (emailResult.success) {
              verificationEmailSent = true;
              console.log(
                '[Login API] Verification email sent successfully to:',
                email
              );
            } else {
              emailError =
                emailResult.error || 'Failed to send verification email';
              console.error('[Login API] Custom email failed:', emailError);

              // Fallback: Try Supabase's built-in email verification
              try {
                const baseUrl =
                  process.env.NEXT_PUBLIC_APP_URL ||
                  process.env.NEXT_PUBLIC_SITE_URL ||
                  'http://localhost:3000';

                const { error: resendError } = await supabaseAdmin.auth.resend({
                  type: 'signup',
                  email: userData.email,
                  options: {
                    emailRedirectTo: `${baseUrl}/auth/verify-email`,
                  },
                });

                if (!resendError) {
                  verificationEmailSent = true;
                  emailError = null;
                  console.log(
                    '[Login API] Verification email sent via Supabase fallback to:',
                    email
                  );
                } else {
                  console.error(
                    '[Login API] Supabase resend also failed:',
                    resendError
                  );
                  emailError = `Custom email failed: ${emailError}. Supabase resend also failed: ${resendError.message}`;
                }
              } catch (fallbackErr) {
                console.error(
                  '[Login API] Supabase fallback exception:',
                  fallbackErr
                );
                // Keep the original custom email error
              }
            }
          } catch (err) {
            emailError =
              err instanceof Error
                ? err.message
                : 'Failed to send verification email';
            console.error(
              '[Login API] Exception sending verification email:',
              emailError
            );
          }
        } else {
          console.error('[Login API] User not found for email:', email);
        }

        // Return appropriate response based on whether email was sent
        if (verificationEmailSent) {
          return NextResponse.json(
            {
              error: 'Please verify your email address before logging in',
              details:
                'A verification email has been sent to your email address. Please check your inbox and click the verification link.',
              verificationEmailSent: true,
            },
            { status: 401 }
          );
        } else {
          // Email sending failed - provide helpful error message
          const errorDetails = emailError
            ? `Failed to send verification email: ${emailError}. Please contact support or try again later.`
            : 'Failed to send verification email. Please contact support.';

          return NextResponse.json(
            {
              error: 'Please verify your email address before logging in',
              details: errorDetails,
              verificationEmailSent: false,
              emailError: emailError,
            },
            { status: 401 }
          );
        }
      }

      // Provide more helpful error messages
      let errorMessage = 'Invalid credentials';
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (authError.message.includes('User not found')) {
        errorMessage = 'No account found with this email address';
      }

      return NextResponse.json(
        { error: errorMessage, details: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get user profile from our database
    const { data: userData, error: userError } = await supabaseAdmin
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

    if (userError) {
      // If user exists in Auth but not in our database, create the record
      if (
        userError.code === 'PGRST116' ||
        userError.message.includes('No rows found') ||
        userError.message.includes('relation') ||
        userError.message.includes('does not exist')
      ) {
        // Create user record in our database
        const { error: createUserError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            role: 'event_manager', // Default role
            is_verified: true,
            last_login: new Date().toISOString(),
          });

        if (createUserError) {
          // Check if it's a duplicate key error (user already exists)
          if (
            createUserError.code === '23505' ||
            createUserError.message.includes('duplicate key')
          ) {
            // Continue with the login process even if user creation failed
          } else {
            return NextResponse.json(
              {
                error: 'Failed to create user profile',
                details: createUserError.message,
                code: createUserError.code,
              },
              { status: 500 }
            );
          }
        }

        // Create profile record (only if user creation succeeded or was duplicate)
        const { error: createProfileError } = await supabaseAdmin
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
            timezone: 'Pacific/Auckland',
          });

        if (createProfileError) {
          // Check if it's a duplicate key error (profile already exists)
          if (
            createProfileError.code === '23505' ||
            createProfileError.message.includes('duplicate key')
          ) {
          } else {
            // Don't fail login for profile creation error, but log it
          }
        }

        // Retry fetching the user profile
        const { data: retryUserData, error: retryUserError } =
          await supabaseAdmin
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

        if (retryUserError) {
          // Fallback: return basic user data from Auth if database fetch fails
          const jsonResponse = NextResponse.json({
            message: 'Login successful (fallback mode)',
            user: {
              id: authData.user.id,
              email: authData.user.email,
              role: 'event_manager', // Default role
              is_verified: true,
              last_login: new Date().toISOString(),
              profile: {
                first_name:
                  authData.user.user_metadata?.full_name?.split(' ')[0] ||
                  'User',
                last_name:
                  authData.user.user_metadata?.full_name
                    ?.split(' ')
                    .slice(1)
                    .join(' ') || '',
                timezone: 'Pacific/Auckland',
              },
              business_profile: null,
            },
            session: authData.session,
          });

          // Set session cookies if we have a session
          if (authData.session) {
            try {
              const trackedCookies: Array<{
                name: string;
                value: string;
                options: any;
              }> = [];

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
                      trackedCookies.push({ name, value, options });
                      response.cookies.set(name, value, options);
                    },
                    remove(name: string, options: any) {
                      response.cookies.set(name, '', { ...options, maxAge: 0 });
                    },
                  },
                }
              );

              await supabase.auth.setSession({
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
              });

              const isLocalhost = request.headers
                .get('host')
                ?.includes('localhost');
              trackedCookies.forEach(({ name, value, options }) => {
                const cookieOptions = {
                  path: options.path || '/',
                  domain: options.domain,
                  maxAge: options.maxAge || 60 * 60 * 24 * 7,
                  httpOnly: options.httpOnly ?? true,
                  secure: isLocalhost
                    ? false
                    : (options.secure ?? process.env.NODE_ENV === 'production'),
                  sameSite:
                    (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
                };
                jsonResponse.cookies.set(name, value, cookieOptions);
              });
            } catch (cookieError) {
              console.error(
                '[Login API] Failed to set session cookies (fallback):',
                cookieError
              );
            }
          }

          return jsonResponse;
        }

        // Use the retry data for the rest of the function
        const userData = retryUserData;

        // Get business profile if contractor
        let businessProfile = null;
        if (userData.role === 'contractor') {
          const { data: businessData } = await supabaseAdmin
            .from('business_profiles')
            .select('id, company_name, subscription_tier, is_verified')
            .eq('user_id', authData.user.id)
            .single();

          businessProfile = businessData;
        }

        // Create JSON response first
        const jsonResponse = NextResponse.json({
          message: 'Login successful',
          user: {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            is_verified: userData.is_verified,
            last_login: userData.last_login,
            profile: userData.profiles,
            business_profile: businessProfile,
          },
          session: authData.session,
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
            const isLocalhost = request.headers
              .get('host')
              ?.includes('localhost');
            trackedCookies.forEach(({ name, value, options }) => {
              const cookieOptions = {
                path: options.path || '/',
                domain: options.domain,
                maxAge: options.maxAge || 60 * 60 * 24 * 7, // Default to 7 days
                httpOnly: options.httpOnly ?? true,
                secure: isLocalhost
                  ? false
                  : (options.secure ?? process.env.NODE_ENV === 'production'),
                sameSite:
                  (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              };
              jsonResponse.cookies.set(name, value, cookieOptions);
            });

            console.log(
              '[Login API] Session cookies set successfully (new user):',
              {
                count: trackedCookies.length,
                names: trackedCookies.map(c => c.name),
              }
            );
          } catch (cookieError) {
            console.error(
              '[Login API] Failed to set session cookies:',
              cookieError
            );
            // Don't fail the request, but log the error
          }
        }

        return jsonResponse;
      }

      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: userError.message },
        { status: 500 }
      );
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    // Get business profile if contractor
    let businessProfile = null;
    if (userData.role === 'contractor') {
      const { data: businessData } = await supabaseAdmin
        .from('business_profiles')
        .select('id, company_name, subscription_tier, is_verified')
        .eq('user_id', authData.user.id)
        .single();

      businessProfile = businessData;
    }

    // Create JSON response first
    const jsonResponse = NextResponse.json({
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        is_verified: userData.is_verified,
        last_login: userData.last_login,
        profile: userData.profiles,
        business_profile: businessProfile,
      },
      session: authData.session,
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

        console.log('[Login API] Session cookies set successfully:', {
          count: trackedCookies.length,
          names: trackedCookies.map(c => c.name),
        });
      } catch (cookieError) {
        console.error(
          '[Login API] Failed to set session cookies:',
          cookieError
        );
        // Don't fail the request, but log the error
      }
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
