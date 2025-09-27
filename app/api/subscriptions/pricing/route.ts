import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/subscriptions/subscription-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const billingCycle = searchParams.get('billing_cycle');

    const subscriptionService = new SubscriptionService();

    if (tier && billingCycle) {
      // Get specific pricing
      const pricing = await subscriptionService.getPricing(
        tier as any,
        billingCycle as any
      );
      return NextResponse.json({ pricing });
    } else {
      // Get all pricing
      const { data: pricing, error } = await supabase
        .from('subscription_pricing')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true });

      if (error) {
        throw new Error(`Failed to get pricing: ${error.message}`);
      }

      return NextResponse.json({ pricing });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { tier, billing_cycle, price, is_active = true } = body;

    if (!tier || !billing_cycle || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, billing_cycle, price' },
        { status: 400 }
      );
    }

    // Check if pricing already exists
    const { data: existingPricing } = await supabase
      .from('subscription_pricing')
      .select('id')
      .eq('tier', tier)
      .eq('billing_cycle', billing_cycle)
      .single();

    if (existingPricing) {
      // Update existing pricing
      const { data, error } = await supabase
        .from('subscription_pricing')
        .update({ price, is_active })
        .eq('id', existingPricing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update pricing: ${error.message}`);
      }

      return NextResponse.json({ pricing: data });
    } else {
      // Create new pricing
      const { data, error } = await supabase
        .from('subscription_pricing')
        .insert({ tier, billing_cycle, price, is_active })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create pricing: ${error.message}`);
      }

      return NextResponse.json({ pricing: data });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to manage pricing' },
      { status: 500 }
    );
  }
}
