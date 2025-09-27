import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const contractorId = params.id;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Verify contractor exists and is verified
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select('id, role, is_verified')
      .eq('id', contractorId)
      .eq('role', 'contractor')
      .eq('is_verified', true)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Get contractor services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(
        `
        id,
        service_type,
        description,
        price_range_min,
        price_range_max,
        availability,
        created_at,
        updated_at
      `
      )
      .eq('user_id', contractorId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (servicesError) {
      return NextResponse.json(
        { error: 'Failed to fetch contractor services' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      services: services || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
