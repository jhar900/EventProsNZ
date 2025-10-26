import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAdminAccess } from '@/lib/middleware/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const supabase = createClient();

    // Get total actions count
    const { count: totalActions, error: totalError } = await supabase
      .from('admin_actions')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total actions count:', totalError);
      return NextResponse.json(
        { error: 'Failed to fetch total actions count' },
        { status: 500 }
      );
    }

    // Get today's actions count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayActions, error: todayError } = await supabase
      .from('admin_actions')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', today.toISOString());

    if (todayError) {
      console.error('Error fetching today actions count:', todayError);
      return NextResponse.json(
        { error: 'Failed to fetch today actions count' },
        { status: 500 }
      );
    }

    // Get this week's actions count
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: thisWeekActions, error: thisWeekError } = await supabase
      .from('admin_actions')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', weekAgo.toISOString());

    if (thisWeekError) {
      console.error('Error fetching this week actions count:', thisWeekError);
      return NextResponse.json(
        { error: 'Failed to fetch this week actions count' },
        { status: 500 }
      );
    }

    // Get this month's actions count
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const { count: thisMonthActions, error: thisMonthError } = await supabase
      .from('admin_actions')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', monthAgo.toISOString());

    if (thisMonthError) {
      console.error('Error fetching this month actions count:', thisMonthError);
      return NextResponse.json(
        { error: 'Failed to fetch this month actions count' },
        { status: 500 }
      );
    }

    const stats = {
      total_actions: totalActions || 0,
      today_actions: todayActions || 0,
      this_week_actions: thisWeekActions || 0,
      this_month_actions: thisMonthActions || 0,
    };

    return NextResponse.json({
      stats,
    });
  } catch (error) {
    console.error('Error in admin actions stats GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
