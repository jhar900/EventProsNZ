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
    console.error('Error fetching business profile:', error);
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
    const validatedData = businessProfileSchema.parse(body);

    // Update or create business profile
    const { data: businessProfile, error: upsertError } = await supabase
      .from('business_profiles')
      .upsert({
        user_id: user.id,
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

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
    console.error('Error updating business profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
