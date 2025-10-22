import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const getApplicationLimitsSchema = z.object({
  contractor_id: z.string().uuid().optional(),
});

// GET /api/contractors/application-limits - Get contractor's application limits
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Parse and validate parameters
    const parsedParams = getApplicationLimitsSchema.parse(params);
    const contractorId = parsedParams.contractor_id || user.id;

    // Verify the contractor is requesting their own limits or user is admin
    if (contractorId !== user.id) {
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to view these limits' },
          { status: 403 }
        );
      }
    }

    // Get contractor's subscription information
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select(
        `
        id,
        subscription_tier,
        subscription_start_date,
        subscription_end_date
      `
      )
      .eq('id', contractorId)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { success: false, error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Get contractor's business profile to check service category
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('service_category, service_category_changed_at')
      .eq('user_id', contractorId)
      .single();

    // Get applications for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: applications, error: applicationsError } = await supabase
      .from('job_applications')
      .select('id, created_at')
      .eq('contractor_id', contractorId)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    if (applicationsError) {
      throw new Error(
        `Failed to fetch applications: ${applicationsError.message}`
      );
    }

    // Calculate limits based on subscription tier
    const subscriptionLimits = {
      essential: { monthly: 2, name: 'Essential' },
      showcase: { monthly: 5, name: 'Showcase' },
      spotlight: { monthly: -1, name: 'Spotlight' }, // -1 means unlimited
    };

    const tier = contractor.subscription_tier || 'essential';
    const limits =
      subscriptionLimits[tier as keyof typeof subscriptionLimits] ||
      subscriptionLimits.essential;

    const totalApplications = applications?.length || 0;
    const remainingApplications =
      limits.monthly === -1
        ? -1
        : Math.max(0, limits.monthly - totalApplications);

    // Calculate reset date (first day of next month)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const resetDate = nextMonth.toISOString();

    // Check service category change restrictions
    const serviceCategoryChangeAllowed =
      !businessProfile?.service_category_changed_at ||
      (businessProfile.service_category_changed_at &&
        new Date(businessProfile.service_category_changed_at) <
          new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)); // 14 days ago

    return NextResponse.json({
      success: true,
      limits: {
        tier: tier,
        tier_name: limits.name,
        monthly_limit: limits.monthly,
        used: totalApplications,
        remaining: remainingApplications,
        reset_date: resetDate,
        is_unlimited: limits.monthly === -1,
      },
      restrictions: {
        service_category_change_allowed: serviceCategoryChangeAllowed,
        service_category_changed_at:
          businessProfile?.service_category_changed_at,
        next_change_allowed_at: businessProfile?.service_category_changed_at
          ? new Date(
              new Date(businessProfile.service_category_changed_at).getTime() +
                14 * 24 * 60 * 60 * 1000
            ).toISOString()
          : null,
      },
      current_service_category: businessProfile?.service_category,
    });
  } catch (error) {
    console.error('GET /api/contractors/application-limits error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch application limits',
      },
      { status: 500 }
    );
  }
}
