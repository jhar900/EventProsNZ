import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createRateLimit } from '@/lib/rate-limiting';

// Create rate limiter for pricing API
const pricingRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute per IP
});

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await pricingRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            ).toString(),
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Validate request method
    if (request.method !== 'GET') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (
      limit &&
      (isNaN(Number(limit)) || Number(limit) < 0 || Number(limit) > 100)
    ) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 0 and 100.' },
        { status: 400 }
      );
    }

    if (offset && (isNaN(Number(offset)) || Number(offset) < 0)) {
      return NextResponse.json(
        { error: 'Invalid offset parameter. Must be a non-negative number.' },
        { status: 400 }
      );
    }

    // Mock data for development/testing
    const tiers = [
      {
        id: 'essential',
        name: 'Essential',
        price: 0,
        price_annual: 0,
        billing_cycle: 'monthly',
        features: [
          'Basic Profile',
          'Portfolio Upload (5 items)',
          'Basic Search Visibility',
          'Contact Form',
          'Basic Analytics',
        ],
        limits: {
          portfolio_upload: 5,
        },
        is_trial_eligible: false,
        is_popular: false,
      },
      {
        id: 'showcase',
        name: 'Showcase',
        price: 29,
        price_annual: 299,
        billing_cycle: 'monthly',
        features: [
          'Enhanced Profile',
          'Portfolio Upload (20 items)',
          'Priority Search Visibility',
          'Direct Contact',
          'Advanced Analytics',
          'Featured Badge',
          'Social Media Integration',
          'Video Portfolio (5 items)',
        ],
        limits: {
          portfolio_upload: 20,
          video_portfolio: 5,
        },
        is_trial_eligible: true,
        is_popular: true,
      },
      {
        id: 'spotlight',
        name: 'Spotlight',
        price: 69,
        price_annual: 699,
        billing_cycle: 'monthly',
        features: [
          'Premium Profile',
          'Unlimited Portfolio',
          'Top Search Visibility',
          'Direct Contact',
          'Premium Analytics',
          'Premium Badge',
          'Social Media Integration',
          'Unlimited Video Portfolio',
          'Priority Support',
          'Custom Branding',
          'Advanced Matching',
        ],
        limits: {
          portfolio_upload: null,
          video_portfolio: null,
        },
        is_trial_eligible: true,
        is_popular: false,
      },
    ];

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing tiers' },
      { status: 500 }
    );
  }
}
