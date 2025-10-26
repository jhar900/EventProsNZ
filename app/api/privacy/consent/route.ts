import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ConsentManagementService } from '@/lib/privacy/consent-management-service';
import { withSecurity } from '@/lib/middleware/security-middleware';
import { withRateLimit } from '@/lib/rate-limiting';
import { withCache } from '@/lib/cache/cache-middleware';

const consentService = new ConsentManagementService();

// Validation schemas
const getConsentSchema = z.object({
  userId: z.string().uuid().optional(),
  consentType: z.string().optional(),
  status: z.enum(['active', 'withdrawn', 'expired']).optional(),
});

const createConsentSchema = z.object({
  userId: z.string().uuid(),
  consentType: z.string().min(1).max(100),
  purpose: z.string().min(1).max(500),
  legalBasis: z.string().min(1).max(200),
  dataCategories: z.array(z.string()).min(1),
  retentionPeriod: z.number().min(1),
  isRequired: z.boolean().optional().default(false),
  canWithdraw: z.boolean().optional().default(true),
  expiresAt: z.string().datetime().optional(),
});

const updateConsentSchema = z.object({
  status: z.enum(['active', 'withdrawn', 'expired']).optional(),
  purpose: z.string().min(1).max(500).optional(),
  dataCategories: z.array(z.string()).min(1).optional(),
  retentionPeriod: z.number().min(1).optional(),
  isRequired: z.boolean().optional(),
  canWithdraw: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

const grantConsentSchema = z.object({
  consentId: z.string().uuid(),
  grantedAt: z.string().datetime().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

const withdrawConsentSchema = z.object({
  consentId: z.string().uuid(),
  reason: z.string().max(500).optional(),
  withdrawnAt: z.string().datetime().optional(),
});

/**
 * GET /api/privacy/consent
 * Get user consent information
 */
export const GET = withSecurity(
  withRateLimit(
    withCache(async (request: NextRequest) => {
      try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const consentType = searchParams.get('consentType');
        const status = searchParams.get('status');

        const validatedParams = getConsentSchema.parse({
          userId: userId || undefined,
          consentType: consentType || undefined,
          status: (status as any) || undefined,
        });

        let consents;
        if (userId) {
          consents = await consentService.getUserConsents(userId);
        } else if (consentType) {
          consents = await consentService.getConsentsByType(consentType);
        } else {
          consents = await consentService.getAllConsents();
        }

        // Filter by status if provided
        if (validatedParams.status) {
          consents = consents.filter(
            consent => consent.status === validatedParams.status
          );
        }

        return NextResponse.json({
          success: true,
          data: consents,
        });
      } catch (error) {
        console.error('Error getting consent data:', error);

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request parameters', details: error.errors },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to get consent data' },
          { status: 500 }
        );
      }
    }),
    { maxRequests: 100, windowMs: 15 * 60 * 1000 } // 100 requests per 15 minutes
  )
);

/**
 * POST /api/privacy/consent
 * Create new consent or grant existing consent
 */
export const POST = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const action = request.headers.get('x-action') || 'create';

      if (action === 'grant') {
        const validatedData = grantConsentSchema.parse(body);

        const consent = await consentService.grantConsent(
          validatedData.consentId,
          validatedData.grantedAt
            ? new Date(validatedData.grantedAt)
            : new Date(),
          validatedData.ipAddress,
          validatedData.userAgent
        );

        return NextResponse.json({
          success: true,
          data: consent,
        });
      } else {
        const validatedData = createConsentSchema.parse(body);

        const consent = await consentService.createConsent({
          ...validatedData,
          expiresAt: validatedData.expiresAt
            ? new Date(validatedData.expiresAt)
            : undefined,
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
      console.error('Error processing consent request:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to process consent request' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 50, windowMs: 15 * 60 * 1000 } // 50 requests per 15 minutes
);

/**
 * PUT /api/privacy/consent
 * Update consent information
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
      const validatedData = updateConsentSchema.parse(body);

      const consent = await consentService.updateConsent(consentId, {
        ...validatedData,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : undefined,
        updatedBy: request.headers.get('x-user-id') || 'system',
      });

      if (!consent) {
        return NextResponse.json(
          { error: 'Consent not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: consent,
      });
    } catch (error) {
      console.error('Error updating consent:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update consent' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 30, windowMs: 15 * 60 * 1000 } // 30 requests per 15 minutes
);

/**
 * DELETE /api/privacy/consent
 * Withdraw consent
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
      const validatedData = withdrawConsentSchema.parse(body);

      const consent = await consentService.withdrawConsent(
        consentId,
        validatedData.reason,
        validatedData.withdrawnAt
          ? new Date(validatedData.withdrawnAt)
          : new Date()
      );

      if (!consent) {
        return NextResponse.json(
          { error: 'Consent not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: consent,
      });
    } catch (error) {
      console.error('Error withdrawing consent:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to withdraw consent' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 20, windowMs: 15 * 60 * 1000 } // 20 requests per 15 minutes
);
