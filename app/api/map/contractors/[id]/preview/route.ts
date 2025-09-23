/**
 * Contractor Preview API
 * GET /api/map/contractors/[id]/preview - Get contractor preview data for map interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractorId = params.id;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get contractor business profile with related data
    const { data: contractor, error } = await supabase
      .from('business_profiles')
      .select(
        `
        user_id,
        company_name,
        business_address,
        description,
        is_verified,
        subscription_tier,
        users!inner(
          id,
          role,
          profiles!inner(
            first_name,
            last_name,
            profile_photo_url
          )
        ),
        services!inner(
          service_type,
          description,
          price_range_min,
          price_range_max
        )
      `
      )
      .eq('user_id', contractorId)
      .eq('users.role', 'contractor')
      .single();

    if (error || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Transform data for preview
    const preview = {
      id: contractor.user_id,
      company_name: contractor.company_name,
      business_address: contractor.business_address,
      description: contractor.description,
      is_verified: contractor.is_verified,
      subscription_tier: contractor.subscription_tier,
      contact_name: `${contractor.users.profiles.first_name} ${contractor.users.profiles.last_name}`,
      profile_photo_url: contractor.users.profiles.profile_photo_url,
      services: contractor.services.map(service => ({
        type: service.service_type,
        description: service.description,
        price_range: {
          min: service.price_range_min,
          max: service.price_range_max,
        },
      })),
      primary_service: contractor.services[0]?.service_type || 'other',
    };

    return NextResponse.json({
      contractor: preview,
    });
  } catch (error) {
    console.error('Contractor preview API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
