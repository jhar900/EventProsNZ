import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const PackageQuerySchema = z.object({
  event_type: z.string().min(1),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
  service_categories: z.array(z.string()).optional(),
});

const PackageApplySchema = z.object({
  event_id: z.string().uuid(),
  package_id: z.string().uuid(),
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
    const eventType = searchParams.get('event_type');
    const locationParam = searchParams.get('location');
    const serviceCategoriesParam = searchParams.get('service_categories');

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Parse location if provided
    let location = null;
    if (locationParam) {
      try {
        location = JSON.parse(locationParam);
      } catch {
        return NextResponse.json(
          { error: 'Invalid location format' },
          { status: 400 }
        );
      }
    }

    // Parse service categories if provided
    let serviceCategories = null;
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
    const validation = PackageQuerySchema.safeParse({
      event_type: eventType,
      location,
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

    // Get package deals
    const { data: packages, error: packagesError } = await supabase
      .from('package_deals')
      .select('*')
      .eq('event_type', eventType)
      .eq('is_active', true)
      .order('discount_percentage', { ascending: false });

    if (packagesError) {
      console.error('Error fetching package deals:', packagesError);
      return NextResponse.json(
        { error: 'Failed to fetch package deals' },
        { status: 500 }
      );
    }

    // Filter packages by service categories if specified
    let filteredPackages = packages || [];
    if (serviceCategories && serviceCategories.length > 0) {
      filteredPackages = filteredPackages.filter(pkg => {
        const packageServices = pkg.service_categories || [];
        return serviceCategories.some(category =>
          packageServices.includes(category)
        );
      });
    }

    // Calculate savings for each package
    const packagesWithSavings = filteredPackages.map(pkg => {
      const basePrice = pkg.base_price || 0;
      const discountAmount = basePrice * (pkg.discount_percentage / 100);
      const finalPrice = basePrice - discountAmount;
      const savings = discountAmount;

      return {
        ...pkg,
        base_price: basePrice,
        discount_amount: Math.round(discountAmount * 100) / 100,
        final_price: Math.round(finalPrice * 100) / 100,
        savings: Math.round(savings * 100) / 100,
        savings_percentage: pkg.discount_percentage,
      };
    });

    // Calculate total potential savings
    const totalSavings = packagesWithSavings.reduce(
      (sum, pkg) => sum + pkg.savings,
      0
    );

    // Sort by savings amount
    packagesWithSavings.sort((a, b) => b.savings - a.savings);

    return NextResponse.json({
      packages: packagesWithSavings,
      savings: Math.round(totalSavings * 100) / 100,
      metadata: {
        event_type: eventType,
        location: location,
        service_categories: serviceCategories,
        total_packages: packagesWithSavings.length,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Package deals error:', error);
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
    const validation = PackageApplySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { event_id, package_id } = validation.data;

    // Verify event ownership
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, event_type')
      .eq('id', event_id)
      .eq('user_id', user.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get package details
    const { data: packageDeal, error: packageError } = await supabase
      .from('package_deals')
      .select('*')
      .eq('id', package_id)
      .eq('is_active', true)
      .single();

    if (packageError || !packageDeal) {
      return NextResponse.json(
        { error: 'Package deal not found or inactive' },
        { status: 404 }
      );
    }

    // Check if package is compatible with event type
    if (packageDeal.event_type !== event.event_type) {
      return NextResponse.json(
        {
          error: 'Package deal is not compatible with event type',
        },
        { status: 400 }
      );
    }

    // Apply package to event
    const { data: appliedPackage, error: applyError } = await supabase
      .from('applied_packages')
      .insert({
        event_id,
        package_id,
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (applyError) {
      console.error('Error applying package:', applyError);
      return NextResponse.json(
        { error: 'Failed to apply package' },
        { status: 500 }
      );
    }

    // Update event budget if package has base price
    if (packageDeal.base_price) {
      const discountAmount =
        packageDeal.base_price * (packageDeal.discount_percentage / 100);
      const newBudget = packageDeal.base_price - discountAmount;

      const { error: budgetError } = await supabase
        .from('events')
        .update({
          budget_total: newBudget,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event_id);

      if (budgetError) {
        console.error('Error updating event budget:', budgetError);
      }
    }

    // Create service breakdown entries for package services
    if (
      packageDeal.service_categories &&
      packageDeal.service_categories.length > 0
    ) {
      const serviceBreakdowns = packageDeal.service_categories.map(
        (category: string) => ({
          event_id,
          service_category: category,
          estimated_cost: packageDeal.base_price
            ? (packageDeal.base_price / packageDeal.service_categories.length) *
              (1 - packageDeal.discount_percentage / 100)
            : 0,
          package_applied: true,
          package_id,
          created_at: new Date().toISOString(),
        })
      );

      const { error: breakdownError } = await supabase
        .from('service_budget_breakdown')
        .upsert(serviceBreakdowns);

      if (breakdownError) {
        console.error('Error creating service breakdown:', breakdownError);
      }
    }

    return NextResponse.json({
      applied_package: {
        ...packageDeal,
        applied_at: appliedPackage.applied_at,
      },
      success: true,
      event_updated: true,
      budget_updated: !!packageDeal.base_price,
    });
  } catch (error) {
    console.error('Package application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
