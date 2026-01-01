import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Extract city name from a New Zealand address string
 * Examples:
 * - "123 Main Street, Auckland, New Zealand" -> "Auckland"
 * - "456 Queen St, Wellington 6011, New Zealand" -> "Wellington"
 * - "789 High St, Christchurch, Canterbury, New Zealand" -> "Christchurch"
 */
function extractCityFromAddress(address: string): string | null {
  if (!address || address.trim() === '') {
    return null;
  }

  // Remove "New Zealand" if present (case insensitive)
  let cleaned = address.replace(/,?\s*New\s+Zealand\s*$/i, '').trim();

  // If no commas, try to extract city from the end of the string
  if (!cleaned.includes(',')) {
    // Try to match a city name at the end (before any postal code)
    const postalCodeMatch = cleaned.match(/\s+(\d{4,5})$/);
    if (postalCodeMatch) {
      cleaned = cleaned.replace(/\s+\d{4,5}$/, '').trim();
    }
    // For addresses without commas, assume the last word(s) might be the city
    // But this is less reliable, so we'll still try to match known cities
    const words = cleaned.split(/\s+/);
    if (words.length > 0) {
      const lastWord = words[words.length - 1];
      // Check if last word matches a known city
      const nzCities = [
        'Auckland',
        'Wellington',
        'Christchurch',
        'Hamilton',
        'Tauranga',
        'Napier',
        'Hastings',
        'Dunedin',
        'Palmerston',
        'Nelson',
        'Rotorua',
        'Plymouth',
        'Whangarei',
        'Invercargill',
        'Whanganui',
        'Gisborne',
        'Timaru',
        'Pukekohe',
        'Masterton',
        'Levin',
        'Ashburton',
        'Queenstown',
        'Taupo',
        'Wanaka',
        'Blenheim',
        'Cambridge',
        'Feilding',
        'Oamaru',
        'Greymouth',
      ];
      const matchedCity = nzCities.find(
        city => city.toLowerCase() === lastWord.toLowerCase()
      );
      if (matchedCity) {
        return matchedCity;
      }
    }
    // If no match found for address without commas, return null
    return null;
  }

  // Split by comma
  const parts = cleaned.split(',').map(part => part.trim());

  if (parts.length === 0) {
    return null;
  }

  // Common NZ cities list for validation
  const nzCities = [
    'Auckland',
    'Wellington',
    'Christchurch',
    'Hamilton',
    'Tauranga',
    'Napier',
    'Hastings',
    'Dunedin',
    'Palmerston North',
    'Nelson',
    'Rotorua',
    'New Plymouth',
    'Whangarei',
    'Invercargill',
    'Whanganui',
    'Gisborne',
    'Timaru',
    'Pukekohe',
    'Masterton',
    'Levin',
    'Ashburton',
    'Queenstown',
    'Taupo',
    'Wanaka',
    'Blenheim',
    'Cambridge',
    'Te Awamutu',
    'Feilding',
    'Oamaru',
    'Greymouth',
  ];

  // Try to find a city name in the address parts
  // Usually the city is the second-to-last or last part
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];

    // Remove postal code if present (e.g., "Wellington 6011" -> "Wellington")
    const cityPart = part.replace(/\s+\d{4,5}$/, '').trim();

    // Check if it matches a known NZ city (case insensitive)
    const matchedCity = nzCities.find(
      city => city.toLowerCase() === cityPart.toLowerCase()
    );

    if (matchedCity) {
      return matchedCity;
    }
  }

  // If no known city found, try the last part (before postal code if present)
  // This handles cases where the city might not be in our list
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    const cityCandidate = lastPart.replace(/\s+\d{4,5}$/, '').trim();

    // Return the city candidate if it's not empty and looks like a city name
    // (not a street address, not too long, doesn't start with a number)
    if (
      cityCandidate &&
      cityCandidate.length < 50 &&
      cityCandidate.length > 2 &&
      !/^\d+/.test(cityCandidate) &&
      !cityCandidate.toLowerCase().includes('street') &&
      !cityCandidate.toLowerCase().includes('road') &&
      !cityCandidate.toLowerCase().includes('avenue') &&
      !cityCandidate.toLowerCase().includes('drive') &&
      !cityCandidate.toLowerCase().includes('lane') &&
      !cityCandidate.toLowerCase().includes('st') &&
      !cityCandidate.toLowerCase().includes('rd') &&
      !cityCandidate.toLowerCase().includes('ave')
    ) {
      return cityCandidate;
    }

    // If last part doesn't work, try second-to-last part
    if (parts.length > 1) {
      const secondLastPart = parts[parts.length - 2];
      const cityCandidate2 = secondLastPart.replace(/\s+\d{4,5}$/, '').trim();

      if (
        cityCandidate2 &&
        cityCandidate2.length < 50 &&
        cityCandidate2.length > 2 &&
        !/^\d+/.test(cityCandidate2) &&
        !cityCandidate2.toLowerCase().includes('street') &&
        !cityCandidate2.toLowerCase().includes('road') &&
        !cityCandidate2.toLowerCase().includes('avenue')
      ) {
        return cityCandidate2;
      }
    }
  }

  return null;
}

const updateBusinessProfileSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location too long').optional(),
  service_areas: z.array(z.string()).optional(),
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

    // First, verify the user exists in public.users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ businessProfile: null });
    }

    // Now try to get the business profile
    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (businessProfileError) {
      // If profile not found, return null instead of error (allows form to work for new users)
      if (businessProfileError.code === 'PGRST116') {
        return NextResponse.json({ businessProfile: null });
      }
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

    // Map location field from form to business_address column in database
    const updateData: any = {
      ...validatedData,
    };

    // Always map location field from form to business_address column in database
    // This ensures business_address is updated whenever location is provided (even if empty string)
    if (validatedData.location !== undefined) {
      // Set business_address to the location value (even if it's an empty string)
      updateData.business_address = validatedData.location || null;
      // Remove location from updateData so we don't update the location column directly
      delete updateData.location;

      // Extract city from business_address and save to location column
      if (
        updateData.business_address &&
        updateData.business_address.trim() !== ''
      ) {
        const extractedCity = extractCityFromAddress(
          updateData.business_address
        );
        updateData.location = extractedCity || null;
        console.log('[DEBUG] Extracted city from business_address:', {
          business_address: updateData.business_address,
          extracted_city: extractedCity,
          location: updateData.location,
        });
      } else {
        // If business_address is cleared, also clear location
        updateData.location = null;
        console.log(
          '[DEBUG] Business address cleared, setting location to null'
        );
      }

      console.log('[DEBUG] Mapping location to business_address:', {
        location: validatedData.location,
        business_address: updateData.business_address,
        locationIsEmpty: validatedData.location === '',
        locationIsNull: validatedData.location === null,
      });
    } else {
      // If location is not provided, don't touch business_address or location
      console.log(
        '[DEBUG] Location field not provided in form data, leaving business_address and location unchanged'
      );
    }

    console.log(
      '[DEBUG] Update data being sent to database:',
      JSON.stringify(updateData, null, 2)
    );
    console.log('[DEBUG] User ID:', user.id);
    console.log(
      '[DEBUG] business_address in updateData:',
      updateData.business_address
    );

    // First, get the current business profile to compare
    const { data: currentProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('business_address, location')
      .eq('user_id', user.id)
      .single();

    console.log(
      '[DEBUG] Current business_address in database:',
      currentProfile?.business_address
    );
    console.log(
      '[DEBUG] Current location in database:',
      currentProfile?.location
    );

    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

    if (businessProfileError) {
      console.error(
        '[ERROR] Business profile update failed:',
        businessProfileError
      );
    } else {
      console.log('[DEBUG] Business profile updated successfully:', {
        business_address: businessProfile?.business_address,
        location: businessProfile?.location,
      });
    }

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

    // Map location field from form to business_address column in database
    const insertData: any = {
      ...validatedData,
    };

    // If location is provided in the form, save it to business_address column
    if (validatedData.location !== undefined) {
      insertData.business_address = validatedData.location || null;
      // Remove location from insertData so we don't set the location column directly
      delete insertData.location;

      // Extract city from business_address and save to location column
      if (
        insertData.business_address &&
        insertData.business_address.trim() !== ''
      ) {
        const extractedCity = extractCityFromAddress(
          insertData.business_address
        );
        insertData.location = extractedCity || null;
        console.log('[DEBUG] Extracted city from business_address (POST):', {
          business_address: insertData.business_address,
          extracted_city: extractedCity,
          location: insertData.location,
        });
      } else {
        // If business_address is empty, set location to null
        insertData.location = null;
      }
    }

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
      ...insertData,
      subscription_tier: 'essential',
    });

    const { data: businessProfile, error: businessProfileError } =
      await supabaseAdmin
        .from('business_profiles')
        .insert({
          user_id: user.id,
          ...insertData,
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
