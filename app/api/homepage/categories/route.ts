import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get service categories with contractor counts
    const { data: categories, error: categoriesError } = await supabase
      .from('service_categories')
      .select(
        `
        id,
        name,
        description,
        is_active
      `
      )
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json(
        {
          error: 'Failed to fetch categories',
          details: categoriesError.message,
        },
        { status: 500 }
      );
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json({
        categories: [],
        total: 0,
      });
    }

    // Get contractor counts for each category
    // Use the same pattern as /api/contractors - join with users table
    // to properly filter by role and status
    const { data: profiles, error: profilesError } = await supabase
      .from('business_profiles')
      .select(
        `
        service_categories,
        users!inner(
          id,
          role,
          status
        )
      `
      )
      .eq('is_published', true)
      .eq('users.role', 'contractor')
      .neq('users.status', 'suspended');

    if (profilesError) {
      console.error('Error fetching business profiles:', profilesError);
      console.error('Error details:', JSON.stringify(profilesError, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to fetch contractor data',
          details: profilesError.message,
        },
        { status: 500 }
      );
    }

    // Calculate counts for each category
    const categoriesWithCounts = categories.map(category => {
      // Count how many profiles have this category in their array
      const contractorCount =
        profiles?.filter(
          profile =>
            profile &&
            profile.service_categories &&
            Array.isArray(profile.service_categories) &&
            profile.service_categories.includes(category.name)
        ).length || 0;

      return {
        id: category.id,
        name: category.name,
        description: category.description || '',
        icon: null, // Icon will be mapped in the frontend component based on category name
        contractor_count: contractorCount,
        popular: contractorCount > 10, // Mark as popular if more than 10 contractors
      };
    });

    return NextResponse.json({
      categories: categoriesWithCounts,
      total: categoriesWithCounts.length,
    });
  } catch (error) {
    console.error('Homepage categories API error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
