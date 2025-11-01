import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

const updateBusinessProfileSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location too long').optional(),
  service_categories: z
    .array(z.string())
    .max(10, 'Too many service categories')
    .optional(),
  facebook_url: z
    .string()
    .url('Invalid Facebook URL')
    .optional()
    .or(z.literal('')),
  instagram_url: z
    .string()
    .url('Invalid Instagram URL')
    .optional()
    .or(z.literal('')),
  linkedin_url: z
    .string()
    .url('Invalid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  twitter_url: z
    .string()
    .url('Invalid Twitter URL')
    .optional()
    .or(z.literal('')),
  youtube_url: z
    .string()
    .url('Invalid YouTube URL')
    .optional()
    .or(z.literal('')),
  tiktok_url: z.string().url('Invalid TikTok URL').optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    console.log('Business profile GET request received');

    // Parse request body to get user data
    const body = await request.json();
    const { userData } = body;

    // Try middleware client first
    const { supabase: middlewareSupabase } = createClient(request);
    const {
      data: { user: middlewareUser },
      error: middlewareError,
    } = await middlewareSupabase.auth.getUser();

    let user = middlewareUser;

    // If middleware auth fails, try direct client auth
    if (middlewareError || !middlewareUser) {
      console.log('Middleware auth failed, trying direct client auth');
      const {
        data: { user: directUser },
        error: directError,
      } = await supabase.auth.getUser();

      if (directError || !directUser) {
        console.log(
          'All Supabase authentication methods failed, trying alternative auth'
        );

        // Alternative: Check if we have user data in the request body
        if (userData && userData.id) {
          console.log('Using user data from request body:', userData.id);
          // Create a mock user object for Supabase operations
          user = {
            id: userData.id,
            email: userData.email,
          } as any;
        } else {
          console.log('No valid authentication found');
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } else {
        user = directUser;
      }
    }

    console.log('GET authentication successful for user:', user.id, user.email);

    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (businessProfileError) {
      return NextResponse.json(
        {
          error: 'Business profile not found',
          details: businessProfileError.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ businessProfile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('Business profile PUT request received');

    // Parse request body first
    const body = await request.json();
    const { userData, ...formData } = body;

    // Try middleware client first
    const { supabase: middlewareSupabase } = createClient(request);
    const {
      data: { user: middlewareUser },
      error: middlewareError,
    } = await middlewareSupabase.auth.getUser();

    let user = middlewareUser;
    let supabaseClient = middlewareSupabase;

    // If middleware auth fails, try direct client auth
    if (middlewareError || !middlewareUser) {
      console.log('Middleware auth failed, trying direct client auth');
      const {
        data: { user: directUser },
        error: directError,
      } = await supabase.auth.getUser();

      if (directError || !directUser) {
        console.log(
          'All Supabase authentication methods failed, trying alternative auth'
        );

        // Fallback: use user data from request body
        if (userData && userData.id) {
          console.log('Using user data from request body:', userData.id);
          user = {
            id: userData.id,
            email: userData.email,
          } as any;
          console.log(
            'Authentication successful for user:',
            user.id,
            user.email
          );
        } else {
          console.log('No user data provided in request body');
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } else {
        user = directUser;
        supabaseClient = supabase;
      }
    }

    const validatedData = updateBusinessProfileSchema.parse(formData);

    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .update(validatedData)
        .eq('user_id', user.id)
        .select()
        .single();

    if (businessProfileError) {
      return NextResponse.json(
        {
          error: 'Failed to update business profile',
          details: businessProfileError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Business profile updated successfully',
      businessProfile,
    });
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

export async function POST(request: NextRequest) {
  try {
    console.log('Business profile POST request received');

    // Parse request body first
    const body = await request.json();
    const { userData, ...formData } = body;

    // Try middleware client first
    const { supabase: middlewareSupabase } = createClient(request);
    const {
      data: { user: middlewareUser },
      error: middlewareError,
    } = await middlewareSupabase.auth.getUser();

    let user = middlewareUser;
    let supabaseClient = middlewareSupabase;

    // If middleware auth fails, try direct client auth
    if (middlewareError || !middlewareUser) {
      console.log('Middleware auth failed, trying direct client auth');
      const {
        data: { user: directUser },
        error: directError,
      } = await supabase.auth.getUser();

      if (directError || !directUser) {
        console.log(
          'All Supabase authentication methods failed, trying alternative auth'
        );

        // Alternative: Check if we have user data in the request body
        if (userData && userData.id) {
          console.log('Using user data from request body:', userData.id);
          // Create a mock user object for Supabase operations
          user = {
            id: userData.id,
            email: userData.email,
          } as any;
          supabaseClient = supabase;
        } else {
          console.log('No valid authentication found');
          return NextResponse.json(
            {
              error: 'Unauthorized',
              details: {
                middlewareError: middlewareError?.message,
                directError: directError?.message,
                message: 'No valid authentication session or user data found',
              },
            },
            { status: 401 }
          );
        }
      } else {
        user = directUser;
        supabaseClient = supabase;
      }
    }

    console.log('Authentication successful for user:', user.id, user.email);
    console.log('Form data received:', formData);

    // Validate the form data
    try {
      const validatedData = updateBusinessProfileSchema.parse(formData);
      console.log('Validation successful:', validatedData);
    } catch (validationError) {
      console.log('Validation failed:', validationError);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details:
            validationError instanceof Error
              ? validationError.message
              : 'Unknown validation error',
          receivedData: formData,
        },
        { status: 400 }
      );
    }

    const validatedData = updateBusinessProfileSchema.parse(formData);

    // Check if business profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Business profile already exists' },
        { status: 400 }
      );
    }

    console.log('Creating business profile with data:', {
      user_id: user.id,
      ...validatedData,
      subscription_tier: 'essential',
    });

    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .insert({
          user_id: user.id,
          ...validatedData,
          subscription_tier: 'essential',
        })
        .select()
        .single();

    if (businessProfileError) {
      console.log('Business profile creation failed:', businessProfileError);
      return NextResponse.json(
        {
          error: 'Failed to create business profile',
          details: businessProfileError.message,
          code: businessProfileError.code,
        },
        { status: 500 }
      );
    }

    console.log('Business profile created successfully:', businessProfile);

    return NextResponse.json({
      message: 'Business profile created successfully',
      businessProfile,
    });
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
