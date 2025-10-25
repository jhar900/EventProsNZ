import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { contactFormRateLimit } from '@/lib/rate-limiting';
import {
  validateCSRFToken,
  getCSRFTokenFromRequest,
  getSessionIdFromRequest,
  createCSRFToken,
} from '@/lib/csrf';

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  newsletter: z.boolean().optional(),
  marketing: z.boolean().optional(),
  csrfToken: z.string().optional(), // CSRF token for form submissions
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await contactFormRateLimit(request);
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
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = contactFormSchema.parse(body);

    // Validate CSRF token
    const sessionId = getSessionIdFromRequest(request);
    const csrfToken =
      getCSRFTokenFromRequest(request) || validatedData.csrfToken;

    if (!csrfToken || !validateCSRFToken(sessionId, csrfToken)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid or missing CSRF token. Please refresh the page and try again.',
        },
        { status: 403 }
      );
    }

    // TODO: Implement actual email sending logic
    // For now, we'll simulate the process

    // Log the contact form submission (in production, this would be stored in database)
    // console.log('Contact form submission:', {
    //   ...validatedData,
    //   submittedAt: new Date().toISOString(),
    //   ip: request.ip || 'unknown',
    // });

    // TODO: Send email notification to support team
    // TODO: Send confirmation email to user
    // TODO: Store in database for tracking

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you for your message. We'll get back to you within 24 hours.",
      },
      { status: 200 }
    );
  } catch (error) {
    // console.error('Contact form error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid form data',
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit contact form. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const sessionId = getSessionIdFromRequest(request);
  const csrfToken = createCSRFToken(sessionId);

  return NextResponse.json(
    {
      message: 'Contact API endpoint',
      csrfToken,
    },
    { status: 200 }
  );
}
