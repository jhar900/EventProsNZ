import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const contractorId = params.id;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');

    const offset = (page - 1) * limit;

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

    // Build query for portfolio items
    let query = supabase
      .from('portfolio')
      .select('*', { count: 'exact' })
      .eq('user_id', contractorId)
      .eq('is_visible', true)
      .order('event_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category);
    }

    const { data: portfolio, error: portfolioError, count } = await query;

    if (portfolioError) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio' },
        { status: 500 }
      );
    }

    // Get available categories for filtering
    const { data: categories } = await supabase
      .from('portfolio')
      .select('category')
      .eq('user_id', contractorId)
      .eq('is_visible', true)
      .not('category', 'is', null);

    const uniqueCategories = [
      ...new Set(categories?.map(c => c.category) || []),
    ];

    return NextResponse.json({
      portfolio: portfolio || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      categories: uniqueCategories,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
