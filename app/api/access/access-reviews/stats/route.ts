import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();

    // Get review counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('access_reviews')
      .select('status')
      .then(({ data }) => {
        const counts =
          data?.reduce(
            (acc, review) => {
              acc[review.status] = (acc[review.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ) || {};

        return {
          data: counts,
          error: null,
        };
      });

    if (statusError) {
      console.error('Error fetching review stats:', statusError);
      return NextResponse.json(
        { error: 'Failed to fetch review stats' },
        { status: 500 }
      );
    }

    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('access_reviews')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total count:', totalError);
      return NextResponse.json(
        { error: 'Failed to fetch total count' },
        { status: 500 }
      );
    }

    // Get expired reviews count
    const { count: expiredCount, error: expiredError } = await supabase
      .from('access_reviews')
      .select('*', { count: 'exact', head: true })
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'pending');

    if (expiredError) {
      console.error('Error fetching expired count:', expiredError);
      return NextResponse.json(
        { error: 'Failed to fetch expired count' },
        { status: 500 }
      );
    }

    const stats = {
      total: totalCount || 0,
      pending: statusCounts?.pending || 0,
      approved: statusCounts?.approved || 0,
      rejected: statusCounts?.rejected || 0,
      needs_review: statusCounts?.needs_review || 0,
      expired: expiredCount || 0,
    };

    return NextResponse.json({
      stats,
    });
  } catch (error) {
    console.error('Error in access reviews stats GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
