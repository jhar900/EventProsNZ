import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { newsletterRateLimit } from '@/lib/rate-limiting';

const newsletterSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  preferences: z
    .array(z.string())
    .min(1, 'At least one preference must be selected'),
  source: z.string().optional(),
});

const validPreferences = [
  'tips',
  'updates',
  'success',
  'industry',
  'contractors',
  'events',
];

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await newsletterRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests. Please try again later.',
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
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = newsletterSignupSchema.parse(body);

    // Validate preferences
    const invalidPreferences = validatedData.preferences.filter(
      pref => !validPreferences.includes(pref)
    );

    if (invalidPreferences.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid newsletter preferences',
        },
        { status: 400 }
      );
    }

    // TODO: Implement actual newsletter signup logic
    // For now, we'll simulate the process

    // Check for duplicate email (in production, this would query the database)
    // For now, we'll use a simple in-memory check
    const existingEmails = new Set<string>(); // In production, this would be a database query

    if (existingEmails.has(validatedData.email.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          message: 'This email is already subscribed to our newsletter.',
        },
        { status: 409 }
      );
    }

    // Add to our tracking (in production, this would be stored in database)
    existingEmails.add(validatedData.email.toLowerCase());

    // Log the newsletter signup (in production, this would be stored in database)
    // console.log('Newsletter signup:', {
    //   email: validatedData.email,
    //   preferences: validatedData.preferences,
    //   source: validatedData.source || 'unknown',
    //   subscribedAt: new Date().toISOString(),
    //   ip: request.ip || 'unknown',
    // });

    // TODO: Add to newsletter database
    // TODO: Send welcome email
    // TODO: Set up email automation based on preferences

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter!',
      },
      { status: 200 }
    );
  } catch (error) {
    // console.error('Newsletter signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid signup data',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to subscribe to newsletter. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Newsletter signup API endpoint' },
    { status: 200 }
  );
}
