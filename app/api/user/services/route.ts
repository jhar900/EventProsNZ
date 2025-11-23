import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request headers (sent by client)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Get business profile ID for this user
    const { data: businessProfile, error: profileError } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      // If no business profile, return empty array
      return NextResponse.json({ services: [] });
    }

    const businessProfileId = businessProfile.id;

    // Fetch services for this business profile
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('business_profile_id', businessProfileId)
      .order('created_at', { ascending: true });

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json({ services: [] });
    }

    // Map database structure to form structure
    const mappedServices = (services || []).map(service => ({
      service_name: service.service_name || service.name || '',
      service_type: service.category || service.service_type || '',
      description: service.description || '',
      price_range_min: service.price_range_min || undefined,
      price_range_max: service.price_range_max || undefined,
      availability: service.availability || '',
    }));

    return NextResponse.json({ services: mappedServices });
  } catch (error) {
    console.error('Error in GET /api/user/services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


