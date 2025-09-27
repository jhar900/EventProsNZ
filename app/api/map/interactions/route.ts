/**
 * Map Interactions API
 * POST /api/map/interactions - Record map interaction analytics
 * GET /api/map/interactions/analytics - Get interaction analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interaction_type, contractor_id, map_bounds, zoom_level } = body;

    // Validate required fields
    if (!interaction_type || !contractor_id) {
      return NextResponse.json(
        { error: 'interaction_type and contractor_id are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get current user (if authenticated)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      // Continue without user ID for anonymous interactions
    }

    // Record the interaction
    const { error: insertError } = await supabase
      .from('map_interactions')
      .insert({
        user_id: user?.id || null,
        interaction_type,
        contractor_id,
        map_bounds: map_bounds || null,
        zoom_level: zoom_level || null,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to record interaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const supabase = createClient();

    // Build date filter
    let dateFilter = {};
    if (dateFrom && dateTo) {
      dateFilter = {
        gte: dateFrom,
        lte: dateTo,
      };
    } else {
      // Default to last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter = {
        gte: sevenDaysAgo.toISOString(),
      };
    }

    // Get interaction analytics
    const { data: interactions, error } = await supabase
      .from('map_interactions')
      .select(
        `
        interaction_type,
        contractor_id,
        zoom_level,
        created_at,
        contractors:contractor_id(
          company_name,
          service_type
        )
      `
      )
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte || new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch interactions' },
        { status: 500 }
      );
    }

    // Process analytics data
    const analytics = {
      total_interactions: interactions?.length || 0,
      interaction_types: {} as Record<string, number>,
      popular_contractors: {} as Record<
        string,
        { name: string; count: number; service_type: string }
      >,
      zoom_levels: {} as Record<number, number>,
      daily_interactions: {} as Record<string, number>,
    };

    // Process interactions
    interactions?.forEach(interaction => {
      // Count interaction types
      analytics.interaction_types[interaction.interaction_type] =
        (analytics.interaction_types[interaction.interaction_type] || 0) + 1;

      // Count popular contractors
      if (interaction.contractors) {
        const contractorId = interaction.contractor_id;
        if (!analytics.popular_contractors[contractorId]) {
          analytics.popular_contractors[contractorId] = {
            name: interaction.contractors.company_name,
            count: 0,
            service_type: interaction.contractors.service_type,
          };
        }
        analytics.popular_contractors[contractorId].count++;
      }

      // Count zoom levels
      if (interaction.zoom_level) {
        analytics.zoom_levels[interaction.zoom_level] =
          (analytics.zoom_levels[interaction.zoom_level] || 0) + 1;
      }

      // Count daily interactions
      const date = new Date(interaction.created_at).toISOString().split('T')[0];
      analytics.daily_interactions[date] =
        (analytics.daily_interactions[date] || 0) + 1;
    });

    // Sort popular contractors by count
    const sortedContractors = Object.entries(analytics.popular_contractors)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .reduce(
        (acc, [id, data]) => {
          acc[id] = data;
          return acc;
        },
        {} as Record<
          string,
          { name: string; count: number; service_type: string }
        >
      );

    analytics.popular_contractors = sortedContractors;

    return NextResponse.json({
      analytics,
      period,
      date_range: {
        from: dateFilter.gte,
        to: dateFilter.lte || new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
