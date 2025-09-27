import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const contractorId = params.id;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Get contractor verification data
    const { data: contractor, error: contractorError } = await supabase
      .from('users')
      .select(
        `
        id,
        is_verified,
        created_at,
        business_profiles!inner(
          is_verified,
          verification_date,
          nzbn,
          subscription_tier,
          service_areas
        ),
        portfolio(count),
        contractor_testimonials(count),
        services(count)
      `
      )
      .eq('id', contractorId)
      .eq('role', 'contractor')
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Calculate verification badges
    const badges = [];
    const businessProfile = contractor.business_profiles;

    // Business verification badge
    if (businessProfile.is_verified) {
      badges.push({
        type: 'business_verified',
        title: 'Verified Business',
        description: 'Business information has been verified',
        icon: 'check-circle',
        color: 'green',
        priority: 1,
      });
    }

    // NZBN registration badge
    if (businessProfile.nzbn) {
      badges.push({
        type: 'nzbn_registered',
        title: 'NZBN Registered',
        description: 'Registered with New Zealand Business Number',
        icon: 'building-office',
        color: 'blue',
        priority: 2,
      });
    }

    // Portfolio quality badge
    const portfolioCount = contractor.portfolio?.[0]?.count || 0;
    if (portfolioCount >= 10) {
      badges.push({
        type: 'portfolio_quality',
        title: 'Quality Portfolio',
        description: `${portfolioCount} portfolio items showcasing work`,
        icon: 'photo',
        color: 'purple',
        priority: 3,
      });
    }

    // Review rating badge
    const reviewCount = contractor.contractor_testimonials?.[0]?.count || 0;
    if (reviewCount >= 5) {
      badges.push({
        type: 'review_rating',
        title: 'Highly Reviewed',
        description: `${reviewCount} customer reviews`,
        icon: 'star',
        color: 'yellow',
        priority: 4,
      });
    }

    // Service coverage badge
    const serviceCount = contractor.services?.[0]?.count || 0;
    if (serviceCount >= 3) {
      badges.push({
        type: 'service_coverage',
        title: 'Multiple Services',
        description: `${serviceCount} services offered`,
        icon: 'cog',
        color: 'indigo',
        priority: 5,
      });
    }

    // Premium profile badge
    if (
      ['professional', 'enterprise'].includes(businessProfile.subscription_tier)
    ) {
      badges.push({
        type: 'premium_profile',
        title: 'Premium Profile',
        description: `${businessProfile.subscription_tier.charAt(0).toUpperCase() + businessProfile.subscription_tier.slice(1)} subscription`,
        icon: 'crown',
        color: 'gold',
        priority: 0,
      });
    }

    // Response time badge (mock data - would be calculated from actual response times)
    const accountAge = Date.now() - new Date(contractor.created_at).getTime();
    const daysSinceJoined = Math.floor(accountAge / (1000 * 60 * 60 * 24));

    if (daysSinceJoined >= 30) {
      badges.push({
        type: 'response_time',
        title: 'Quick Responder',
        description: 'Typically responds within 24 hours',
        icon: 'clock',
        color: 'green',
        priority: 6,
      });
    }

    // Sort badges by priority
    badges.sort((a, b) => a.priority - b.priority);

    const verificationStatus = {
      isVerified: contractor.is_verified && businessProfile.is_verified,
      verificationDate: businessProfile.verification_date,
      badges: badges,
      metrics: {
        portfolioCount,
        reviewCount,
        serviceCount,
        accountAge: daysSinceJoined,
      },
    };

    return NextResponse.json({
      verificationStatus,
      badges,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
