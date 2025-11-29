import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';

const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name too long'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long'),
  phone: z
    .string()
    .regex(/^(\+64|0)[2-9][0-9]{7,9}$/, 'Invalid NZ phone number')
    .optional()
    .or(z.literal('')),
  address: z.string().max(200, 'Address too long').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  timezone: z.string().max(50, 'Timezone too long').optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Try to get user ID from header first
    let userId = request.headers.get('x-user-id');

    // If no header, try cookie-based auth
    if (!userId) {
      const { createClient: createMiddlewareClient } = await import(
        '@/lib/supabase/middleware'
      );
      const { supabase } = createMiddlewareClient(request);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let user = session?.user;

      if (!user) {
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !getUserUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = getUserUser;
      }

      userId = user.id;
    }

    // Create Supabase client with service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found', details: profileError.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try to get user ID from header first
    let userId = request.headers.get('x-user-id');
    console.log('Profile API - Received user ID from header:', userId);

    // If no header, try cookie-based auth
    if (!userId) {
      const { createClient: createMiddlewareClient } = await import(
        '@/lib/supabase/middleware'
      );
      const { supabase } = createMiddlewareClient(request);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let user = session?.user;

      if (!user) {
        const {
          data: { user: getUserUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !getUserUser) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        user = getUserUser;
      }

      userId = user.id;
      console.log('Profile API - Got user ID from session:', userId);
    }

    // Create Supabase client with service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    const body = await request.json();
    console.log('Profile API - Request body:', body);

    const validatedData = updateProfileSchema.parse(body);
    console.log('Profile API - Validated data:', validatedData);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('user_id', userId)
      .select()
      .single();

    console.log('Profile API - Update result:', { profile, profileError });

    if (profileError) {
      console.error('Profile API - Update error:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: profileError.message },
        { status: 500 }
      );
    }

    console.log('Profile API - Update successful');
    return NextResponse.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Profile API - Error:', error);

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
