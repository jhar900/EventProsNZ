import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BudgetService } from '@/lib/budget/budget-service';
import { z } from 'zod';

const ServiceBudgetBreakdownSchema = z.object({
  event_id: z.string().uuid(),
  service_categories: z.array(z.string()).optional(),
});

const BudgetAdjustmentSchema = z.object({
  event_id: z.string().uuid(),
  service_categories: z.array(z.string()),
  adjustments: z.array(
    z.object({
      service_category: z.string(),
      adjustment_type: z.enum(['percentage', 'fixed']),
      adjustment_value: z.number(),
      reason: z.string().optional(),
    })
  ),
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
    const serviceCategoriesParam = searchParams.get('service_categories');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Parse service categories if provided
    let serviceCategories = undefined; // Use undefined instead of null for optional Zod fields
    if (serviceCategoriesParam) {
      try {
        serviceCategories = JSON.parse(serviceCategoriesParam);
      } catch {
        return NextResponse.json(
          { error: 'Invalid service categories format' },
          { status: 400 }
        );
      }
    }

    // Validate input
    const validation = ServiceBudgetBreakdownSchema.safeParse({
      event_id: eventId,
      service_categories: serviceCategories,
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

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Use BudgetService for service breakdown
    const budgetService = new BudgetService();

    try {
      const { breakdown, total } = await budgetService.getServiceBreakdown(
        eventId,
        serviceCategories
      );

      return NextResponse.json({
        breakdown,
        total,
        event: {
          id: event.id,
          title: event.title,
          event_type: event.event_type,
          event_date: event.event_date,
          attendee_count: event.attendee_count,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch service breakdown' },
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

export async function PUT(request: NextRequest) {
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
    const validation = BudgetAdjustmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { event_id, service_categories, adjustments } = validation.data;

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

    // Use BudgetService for budget adjustments
    const budgetService = new BudgetService();

    try {
      const updatedBreakdown = await budgetService.applyBudgetAdjustments(
        event_id,
        adjustments
      );

      // Calculate new total
      const total = updatedBreakdown.reduce(
        (sum, item) => sum + (item.estimated_cost || 0),
        0
      );

      return NextResponse.json({
        breakdown: updatedBreakdown,
        total: Math.round(total * 100) / 100,
        success: true,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to apply budget adjustments' },
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
