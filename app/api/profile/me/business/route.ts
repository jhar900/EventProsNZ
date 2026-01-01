import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const businessProfileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  business_address: z.string().optional(),
  nzbn: z.string().optional(),
  description: z.string().optional(),
  service_areas: z.array(z.string()).optional(),
  social_links: z.record(z.string()).optional(),
});

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

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get business profile
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (businessError) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ business_profile: businessProfile });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log(
      '[DEBUG] Request body received:',
      JSON.stringify(body, null, 2)
    );
    const validatedData = businessProfileSchema.parse(body);
    console.log(
      '[DEBUG] Validated data:',
      JSON.stringify(validatedData, null, 2)
    );

    // Prepare update data - explicitly exclude location from validatedData
    // We'll set it separately after extraction
    const { business_address, ...restValidatedData } = validatedData;
    const updateData: any = {
      user_id: user.id,
      ...restValidatedData,
      updated_at: new Date().toISOString(),
    };

    // Handle business_address and location separately
    // IMPORTANT: Never set location to the full address - only extract the city
    if (business_address !== undefined) {
      // Always set business_address
      updateData.business_address = business_address;

      if (business_address === '' || !business_address) {
        // If address is cleared, also clear location
        updateData.location = null;
        console.log('Business address cleared, setting location to null');
      } else {
        // Extract city from the address
        const extractedCity = extractCityFromAddress(business_address);

        // CRITICAL: Only set location to extracted city or null - NEVER the full address
        if (extractedCity) {
          updateData.location = extractedCity;
          console.log(
            `[SUCCESS] Extracted city "${extractedCity}" from address: "${business_address}"`
          );
        } else {
          updateData.location = null;
          console.log(
            `[WARNING] City extraction failed for address: "${business_address}". Setting location to null.`
          );
        }

        // Safety check: Ensure location is never set to the full address
        if (updateData.location === business_address) {
          console.error(
            `[ERROR] Location was set to full address! This should never happen. Setting to null.`
          );
          updateData.location = null;
        }
      }
    }

    // Explicitly ensure location is never in restValidatedData (in case it somehow got through)
    if (
      'location' in updateData &&
      updateData.location === updateData.business_address
    ) {
      console.error(
        `[ERROR] Location matches business_address! This should never happen.`
      );
      // Re-extract or set to null
      if (updateData.business_address) {
        const reExtracted = extractCityFromAddress(updateData.business_address);
        updateData.location = reExtracted || null;
      } else {
        updateData.location = null;
      }
    }

    // Log the final updateData before sending to database
    console.log(
      '[DEBUG] Final updateData being sent to database:',
      JSON.stringify(updateData, null, 2)
    );
    console.log('[DEBUG] Location value:', updateData.location);
    console.log('[DEBUG] Business address value:', updateData.business_address);

    // Update or create business profile
    const { data: businessProfile, error: upsertError } = await supabase
      .from('business_profiles')
      .upsert(updateData)
      .select()
      .single();

    if (businessProfile) {
      console.log(
        '[DEBUG] Business profile after upsert - location:',
        businessProfile.location
      );
      console.log(
        '[DEBUG] Business profile after upsert - business_address:',
        businessProfile.business_address
      );
    }

    if (upsertError) {
      return NextResponse.json(
        { error: 'Failed to update business profile' },
        { status: 400 }
      );
    }

    return NextResponse.json({ business_profile: businessProfile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
