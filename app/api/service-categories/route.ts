import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Fetch all active service categories (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Fetch active service categories
    const { data: categories, error } = await supabaseAdmin
      .from('service_categories')
      .select('id, name, description, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching service categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch service categories' },
        { status: 500 }
      );
    }

    // Return just the names for backward compatibility
    const categoryNames = (categories || []).map(cat => cat.name);

    return NextResponse.json({
      categories: categoryNames,
      fullCategories: categories || [],
    });
  } catch (error) {
    console.error('Error in GET /api/service-categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
