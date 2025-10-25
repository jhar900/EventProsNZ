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
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    // Validate category parameter
    if (
      category &&
      !['pricing', 'billing', 'trial', 'security'].includes(category)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid category parameter. Must be pricing, billing, trial, or security.',
        },
        { status: 400 }
      );
    }

    // Validate limit parameter
    if (
      limit &&
      (isNaN(Number(limit)) || Number(limit) < 0 || Number(limit) > 100)
    ) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be between 0 and 100.' },
        { status: 400 }
      );
    }

    // Mock FAQ data for development/testing
    const mockFaqs = [
      {
        id: '1',
        question: 'Can I change my subscription plan anytime?',
        answer:
          'Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing cycle.',
        category: 'pricing',
        display_order: 1,
        is_active: true,
      },
      {
        id: '2',
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual subscriptions. All payments are processed securely through Stripe.',
        category: 'billing',
        display_order: 2,
        is_active: true,
      },
      {
        id: '3',
        question: 'Is there a free trial available?',
        answer:
          'Yes! We offer a 14-day free trial for both Showcase and Spotlight plans. No credit card required, and you can cancel anytime during the trial period.',
        category: 'trial',
        display_order: 3,
        is_active: true,
      },
      {
        id: '4',
        question: 'How does the annual discount work?',
        answer:
          'Annual subscriptions offer significant savings - up to 2 months free compared to monthly billing. The discount is automatically applied at checkout.',
        category: 'pricing',
        display_order: 4,
        is_active: true,
      },
      {
        id: '5',
        question: 'Can I cancel my subscription anytime?',
        answer:
          'Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
        category: 'billing',
        display_order: 5,
        is_active: true,
      },
      {
        id: '6',
        question: 'What happens if I exceed my plan limits?',
        answer:
          'We will notify you if you approach your plan limits. You can upgrade your plan or purchase additional capacity as needed.',
        category: 'pricing',
        display_order: 6,
        is_active: true,
      },
      {
        id: '7',
        question: 'Is my data secure?',
        answer:
          'Absolutely. We use enterprise-grade security with SSL encryption, PCI DSS compliance, and regular security audits to protect your data.',
        category: 'security',
        display_order: 7,
        is_active: true,
      },
      {
        id: '8',
        question: 'Do you offer refunds?',
        answer:
          'Yes, we offer a 30-day money-back guarantee for all paid plans. Contact our support team to process your refund.',
        category: 'billing',
        display_order: 8,
        is_active: true,
      },
      {
        id: '9',
        question: 'Can I get a custom plan for my business?',
        answer:
          'Yes, we offer custom enterprise plans for large organizations. Contact our sales team to discuss your specific needs.',
        category: 'pricing',
        display_order: 9,
        is_active: true,
      },
      {
        id: '10',
        question: 'What support is included?',
        answer:
          'All plans include email support. Showcase and Spotlight plans include priority support with faster response times.',
        category: 'billing',
        display_order: 10,
        is_active: true,
      },
    ];

    // Apply filters
    let filteredFaqs = mockFaqs;

    if (category) {
      filteredFaqs = filteredFaqs.filter(f => f.category === category);
    }

    if (limit) {
      filteredFaqs = filteredFaqs.slice(0, Number(limit));
    }

    return NextResponse.json({ faqs: filteredFaqs });
  } catch (error) {
    console.error('Error fetching pricing FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing FAQ' },
      { status: 500 }
    );
  }
}
