import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Return saved layouts (simulated)
    const layouts = [
      {
        id: 'layout_1',
        name: 'Executive Dashboard',
        description: 'High-level overview for executives',
        widgets: [
          {
            id: 'widget_1',
            type: 'realtime-metrics',
            enabled: true,
            position: 0,
            size: 'large',
            config: { refreshInterval: 30, showAlerts: true },
          },
          {
            id: 'widget_2',
            type: 'revenue-analytics',
            enabled: true,
            position: 1,
            size: 'medium',
            config: { showForecast: true, showBreakdown: true },
          },
        ],
        isDefault: false,
        isPublic: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'layout_2',
        name: 'Operations Dashboard',
        description: 'Detailed operational metrics',
        widgets: [
          {
            id: 'widget_3',
            type: 'contractor-performance',
            enabled: true,
            position: 0,
            size: 'large',
            config: { showRankings: true, showTrends: true },
          },
          {
            id: 'widget_4',
            type: 'event-analytics',
            enabled: true,
            position: 1,
            size: 'medium',
            config: { showCategories: true, showSuccess: true },
          },
        ],
        isDefault: false,
        isPublic: false,
        createdAt: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json(layouts);
  } catch (error) {
    console.error('Error fetching dashboard layouts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, widgets, isDefault, isPublic } = body;

    // Create new layout
    const newLayout = {
      id: `layout_${Date.now()}`,
      name,
      description,
      widgets,
      isDefault: isDefault || false,
      isPublic: isPublic || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, you would save this to your database
    console.log('New layout created:', newLayout);

    return NextResponse.json(newLayout);
  } catch (error) {
    console.error('Error creating dashboard layout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
