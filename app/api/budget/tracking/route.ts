import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BudgetService } from '@/lib/budget/budget-service';
import { z } from 'zod';

const BudgetTrackingSchema = z.object({
  event_id: z.string().uuid(),
});

const BudgetTrackingUpdateSchema = z.object({
  event_id: z.string().uuid(),
  service_category: z.string().min(1),
  actual_cost: z.number().min(0),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Validate input
    const validation = BudgetTrackingSchema.safeParse({
      event_id: eventId,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    // Verify event ownership
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, event_type, budget_total')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Use BudgetService for budget insights
    const budgetService = new BudgetService();

    try {
      // Get budget tracking data
      const { data: tracking, error: trackingError } = await supabase
        .from('budget_tracking')
        .select('*')
        .eq('event_id', eventId)
        .order('tracking_date', { ascending: false });

      if (trackingError) {
        throw new Error(
          `Failed to fetch budget tracking: ${trackingError.message}`
        );
      }

      // Get budget insights using BudgetService
      const insights = await budgetService.getBudgetInsights(eventId);

      return NextResponse.json({
        tracking: tracking || [],
        insights,
        event: {
          id: event.id,
          title: event.title,
          event_type: event.event_type,
          budget_total: event.budget_total,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch budget tracking' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = BudgetTrackingUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { event_id, service_category, actual_cost } = validation.data;

    // Verify event ownership
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', event_id)
      .eq('user_id', user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Use BudgetService for budget variance tracking
    const budgetService = new BudgetService();

    try {
      // Track budget variance using BudgetService
      await budgetService.trackBudgetVariance(event_id, {
        [service_category]: actual_cost,
      });

      // Get updated tracking record
      const { data: trackingRecord, error: fetchError } = await supabase
        .from('budget_tracking')
        .select('*')
        .eq('event_id', event_id)
        .eq('service_category', service_category)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Failed to fetch updated tracking' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        tracking: trackingRecord,
        success: true,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to track budget variance' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
