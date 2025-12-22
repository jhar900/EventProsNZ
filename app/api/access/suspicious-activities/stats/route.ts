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

    // Get activity counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('suspicious_activities')
      .select('status')
      .then(({ data }) => {
        const counts =
          data?.reduce(
            (acc, activity) => {
              acc[activity.status] = (acc[activity.status] || 0) + 1;
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
      console.error('Error fetching activity stats:', statusError);
      return NextResponse.json(
        { error: 'Failed to fetch activity stats' },
        { status: 500 }
      );
    }

    // Get severity counts
    const { data: severityCounts, error: severityError } = await supabase
      .from('suspicious_activities')
      .select('severity')
      .then(({ data }) => {
        const counts =
          data?.reduce(
            (acc, activity) => {
              acc[activity.severity] = (acc[activity.severity] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ) || {};

        return {
          data: counts,
          error: null,
        };
      });

    if (severityError) {
      console.error('Error fetching severity stats:', severityError);
      return NextResponse.json(
        { error: 'Failed to fetch severity stats' },
        { status: 500 }
      );
    }

    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('suspicious_activities')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total count:', totalError);
      return NextResponse.json(
        { error: 'Failed to fetch total count' },
        { status: 500 }
      );
    }

    const stats = {
      total: totalCount || 0,
      open: statusCounts?.open || 0,
      investigating: statusCounts?.investigating || 0,
      resolved: statusCounts?.resolved || 0,
      false_positive: statusCounts?.false_positive || 0,
      severity: {
        low: severityCounts?.low || 0,
        medium: severityCounts?.medium || 0,
        high: severityCounts?.high || 0,
        critical: severityCounts?.critical || 0,
      },
    };

    return NextResponse.json({
      stats,
    });
  } catch (error) {
    console.error('Error in suspicious activities stats GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
