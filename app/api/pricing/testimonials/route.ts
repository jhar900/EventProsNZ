import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createRateLimit } from '@/lib/rate-limiting';

export const dynamic = 'force-dynamic';

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
    const tier = searchParams.get('tier');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    // Validate tier parameter
    if (tier && !['essential', 'showcase', 'spotlight'].includes(tier)) {
      return NextResponse.json(
        {
          error:
            'Invalid tier parameter. Must be essential, showcase, or spotlight.',
        },
        { status: 400 }
      );
    }

    // Validate featured parameter
    if (featured && !['true', 'false'].includes(featured)) {
      return NextResponse.json(
        { error: 'Invalid featured parameter. Must be true or false.' },
        { status: 400 }
      );
    }

    // Validate limit parameter
    if (
      limit &&
      (isNaN(Number(limit)) || Number(limit) < 0 || Number(limit) > 50)
    ) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 0 and 50.' },
        { status: 400 }
      );
    }

    // Mock testimonials data for development/testing
    const mockTestimonials = [
      {
        id: '1',
        contractor_id: '44444444-4444-4444-4444-444444444444',
        contractor_name: 'Premium Catering Co',
        content:
          'The Showcase plan has transformed my business. I get 3x more inquiries and my profile stands out from the competition. The investment paid for itself in the first month!',
        rating: 5,
        tier: 'showcase',
        is_featured: true,
        is_verified: true,
        is_public: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        contractor_id: '55555555-5555-5555-5555-555555555555',
        contractor_name: 'Snapshots Photography',
        content:
          'Spotlight tier gives me everything I need to showcase my work professionally. The unlimited portfolio and priority placement have been game-changers for my photography business.',
        rating: 5,
        tier: 'spotlight',
        is_featured: true,
        is_verified: true,
        is_public: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        contractor_id: '66666666-6666-6666-6666-666666666666',
        contractor_name: 'DJ Services NZ',
        content:
          'Even the Essential plan helped me get started. The free trial let me test the platform before committing, and I quickly saw the value in upgrading.',
        rating: 4,
        tier: 'essential',
        is_featured: false,
        is_verified: true,
        is_public: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '4',
        contractor_id: '77777777-7777-7777-7777-777777777777',
        contractor_name: 'Grand Hall Venues',
        content:
          'The analytics on the Showcase plan help me understand my clients better. I can see exactly what services they are looking for and tailor my offerings accordingly.',
        rating: 5,
        tier: 'showcase',
        is_featured: true,
        is_verified: true,
        is_public: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '5',
        contractor_id: '88888888-8888-8888-8888-888888888888',
        contractor_name: 'Elegant Designs',
        content:
          'Spotlight tier is worth every penny. The custom branding and advanced matching features have helped me land high-end clients I never would have reached otherwise.',
        rating: 5,
        tier: 'spotlight',
        is_featured: true,
        is_verified: true,
        is_public: true,
        created_at: new Date().toISOString(),
      },
    ];

    // Apply filters
    let filteredTestimonials = mockTestimonials;

    if (featured) {
      filteredTestimonials = filteredTestimonials.filter(
        t => t.is_verified === (featured === 'true')
      );
    }

    if (limit) {
      filteredTestimonials = filteredTestimonials.slice(0, Number(limit));
    }

    return NextResponse.json({ testimonials: filteredTestimonials });
  } catch (error) {
    console.error('Error fetching pricing testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing testimonials' },
      { status: 500 }
    );
  }
}
