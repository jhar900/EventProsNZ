import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CookieConsentService } from '@/lib/privacy/cookie-consent-service';
import { withSecurity } from '@/lib/middleware/security-middleware';
import { withRateLimit } from '@/lib/rate-limiting';
import { withCache } from '@/lib/cache/cache-middleware';

const cookieConsentService = new CookieConsentService();

// Validation schemas
const getCookieConsentSchema = z.object({
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
});

const recordConsentSchema = z.object({
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  consentData: z.object({
    necessary: z.boolean(),
    functional: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean(),
    preferences: z.boolean(),
  }),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  consentVersion: z.string().optional(),
});

const updatePreferencesSchema = z.object({
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  preferences: z.object({
    necessary: z.boolean(),
    functional: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean(),
    preferences: z.boolean(),
  }),
  updatedAt: z.string().datetime().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  isRequired: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  cookies: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        purpose: z.string().min(1).max(200),
        domain: z.string().min(1).max(100),
        expires: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * GET /api/privacy/cookies
 * Get cookie consent information
 */
export const GET = withSecurity(
  withRateLimit(
    withCache(async (request: NextRequest) => {
      try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const sessionId = searchParams.get('sessionId');
        const action = searchParams.get('action');

        const validatedParams = getCookieConsentSchema.parse({
          userId: userId || undefined,
          sessionId: sessionId || undefined,
        });

        if (action === 'categories') {
          // Get cookie categories
          const categories = await cookieConsentService.getCookieCategories();

          return NextResponse.json({
            success: true,
            data: categories,
          });
        } else if (action === 'analytics') {
          // Get cookie consent analytics
          const analytics = await cookieConsentService.getConsentAnalytics();

          return NextResponse.json({
            success: true,
            data: analytics,
          });
        } else {
          // Get user's cookie consent
          let consent;
          if (validatedParams.userId) {
            consent = await cookieConsentService.getUserConsent(
              validatedParams.userId
            );
          } else if (validatedParams.sessionId) {
            consent = await cookieConsentService.getSessionConsent(
              validatedParams.sessionId
            );
          } else {
            return NextResponse.json(
              { error: 'User ID or Session ID is required' },
              { status: 400 }
            );
          }

          return NextResponse.json({
            success: true,
            data: consent,
          });
        }
      } catch (error) {
        console.error('Error getting cookie consent:', error);

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request parameters', details: error.errors },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to get cookie consent' },
          { status: 500 }
        );
      }
    }),
    { maxRequests: 100, windowMs: 15 * 60 * 1000 } // 100 requests per 15 minutes
  )
);

/**
 * POST /api/privacy/cookies
 * Record cookie consent or create category
 */
export const POST = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const action = request.headers.get('x-action') || 'consent';

      if (action === 'category') {
        // Create cookie category
        const validatedData = createCategorySchema.parse(body);

        const category = await cookieConsentService.createCookieCategory({
          ...validatedData,
          createdBy: request.headers.get('x-user-id') || 'system',
        });

        return NextResponse.json(
          {
            success: true,
            data: category,
          },
          { status: 201 }
        );
      } else {
        // Record cookie consent
        const validatedData = recordConsentSchema.parse(body);

        const consent = await cookieConsentService.recordConsent({
          userId: validatedData.userId,
          sessionId: validatedData.sessionId,
          consentData: validatedData.consentData,
          ipAddress: validatedData.ipAddress || request.ip,
          userAgent:
            validatedData.userAgent || request.headers.get('user-agent'),
          consentVersion: validatedData.consentVersion || '1.0',
          recordedAt: new Date(),
          createdBy: request.headers.get('x-user-id') || 'system',
        });

        return NextResponse.json(
          {
            success: true,
            data: consent,
          },
          { status: 201 }
        );
      }
    } catch (error) {
      console.error('Error processing cookie consent request:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to process cookie consent request' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 50, windowMs: 15 * 60 * 1000 } // 50 requests per 15 minutes
);

/**
 * PUT /api/privacy/cookies
 * Update cookie preferences
 */
export const PUT = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const consentId = searchParams.get('id');

      if (!consentId) {
        return NextResponse.json(
          { error: 'Consent ID is required' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const validatedData = updatePreferencesSchema.parse(body);

      const updatedConsent = await cookieConsentService.updatePreferences(
        consentId,
        validatedData.preferences,
        validatedData.updatedAt ? new Date(validatedData.updatedAt) : new Date()
      );

      if (!updatedConsent) {
        return NextResponse.json(
          { error: 'Cookie consent not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedConsent,
      });
    } catch (error) {
      console.error('Error updating cookie preferences:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update cookie preferences' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 30, windowMs: 15 * 60 * 1000 } // 30 requests per 15 minutes
);

/**
 * DELETE /api/privacy/cookies
 * Withdraw cookie consent
 */
export const DELETE = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const consentId = searchParams.get('id');

      if (!consentId) {
        return NextResponse.json(
          { error: 'Consent ID is required' },
          { status: 400 }
        );
      }

      const body = await request.json().catch(() => ({}));
      const { reason } = z
        .object({
          reason: z.string().max(500).optional(),
        })
        .parse(body);

      const consent = await cookieConsentService.withdrawConsent(
        consentId,
        reason,
        new Date()
      );

      if (!consent) {
        return NextResponse.json(
          { error: 'Cookie consent not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          message: 'Cookie consent withdrawn successfully',
          consentId: consent.id,
        },
      });
    } catch (error) {
      console.error('Error withdrawing cookie consent:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to withdraw cookie consent' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 20, windowMs: 15 * 60 * 1000 } // 20 requests per 15 minutes
);
