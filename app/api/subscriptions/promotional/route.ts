import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const tier = searchParams.get('tier');

    let query = supabase
      .from('promotional_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (code) {
      query = query.eq('code', code);
    }
    if (tier) {
      query = query.contains('tier_applicable', [tier]);
    }

    const { data: codes, error } = await query;

    if (error) {
      throw new Error(`Failed to get promotional codes: ${error.message}`);
    }

    return NextResponse.json({ codes: codes || [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch promotional codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      discount_type,
      discount_value,
      tier_applicable,
      usage_limit,
      expires_at,
    } = body;

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json(
        {
          error: 'Missing required fields: code, discount_type, discount_value',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('promotional_codes')
      .insert({
        code,
        discount_type,
        discount_value,
        tier_applicable: tier_applicable || [],
        usage_limit,
        expires_at,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create promotional code: ${error.message}`);
    }

    return NextResponse.json({ code: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create promotional code' },
      { status: 500 }
    );
  }
}
