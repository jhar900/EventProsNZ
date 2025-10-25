import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get service categories with contractor counts
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select(
        `
        id,
        name,
        description,
        icon,
        is_active,
        sort_order
      `
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      // Log error for debugging
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Get contractor counts for each category
    const categoriesWithCounts = await Promise.all(
      categories?.map(async category => {
        const { count } = await supabase
          .from('contractors')
          .select('*', { count: 'exact', head: true })
          .eq('service_category', category.name)
          .eq('is_published', true)
          .eq('status', 'active');

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          contractor_count: count || 0,
          popular: count && count > 10, // Mark as popular if more than 10 contractors
        };
      }) || []
    );

    return NextResponse.json({
      categories: categoriesWithCounts,
      total: categoriesWithCounts.length,
    });
  } catch (error) {
    // Log error for debugging
    console.error('Homepage categories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
