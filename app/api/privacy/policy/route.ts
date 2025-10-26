import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrivacyPolicyService } from '@/lib/privacy/privacy-policy-service';
import { withSecurity } from '@/lib/middleware/security-middleware';
import { withRateLimit } from '@/lib/rate-limiting';
import { withCache } from '@/lib/cache/cache-middleware';

const privacyPolicyService = new PrivacyPolicyService();

// Validation schemas
const getPolicySchema = z.object({
  version: z.string().optional(),
  includeContent: z.boolean().optional().default(true),
});

const createPolicySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  version: z.string().min(1).max(50),
  effectiveDate: z.string().datetime(),
  dataHandlingProcedures: z
    .array(
      z.object({
        procedure: z.string().min(1),
        description: z.string().min(1),
        legalBasis: z.string().min(1),
      })
    )
    .optional(),
  isActive: z.boolean().optional().default(true),
});

const updatePolicySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  version: z.string().min(1).max(50).optional(),
  effectiveDate: z.string().datetime().optional(),
  dataHandlingProcedures: z
    .array(
      z.object({
        procedure: z.string().min(1),
        description: z.string().min(1),
        legalBasis: z.string().min(1),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/privacy/policy
 * Get privacy policy information
 */
export const GET = withSecurity(
  withRateLimit(
    withCache(async (request: NextRequest) => {
      try {
        const { searchParams } = new URL(request.url);
        const version = searchParams.get('version');
        const includeContent = searchParams.get('includeContent') !== 'false';

        const validatedParams = getPolicySchema.parse({
          version: version || undefined,
          includeContent,
        });

        let policy;
        if (version) {
          policy =
            await privacyPolicyService.getPrivacyPolicyByVersion(version);
        } else {
          policy = await privacyPolicyService.getActivePrivacyPolicy();
        }

        if (!policy) {
          return NextResponse.json(
            { error: 'Privacy policy not found' },
            { status: 404 }
          );
        }

        // Remove content if not requested
        if (!includeContent) {
          policy = { ...policy, content: undefined };
        }

        return NextResponse.json({
          success: true,
          data: policy,
        });
      } catch (error) {
        console.error('Error getting privacy policy:', error);

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request parameters', details: error.errors },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to get privacy policy' },
          { status: 500 }
        );
      }
    }),
    { maxRequests: 100, windowMs: 15 * 60 * 1000 } // 100 requests per 15 minutes
  )
);

/**
 * POST /api/privacy/policy
 * Create a new privacy policy
 */
export const POST = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = createPolicySchema.parse(body);

      const policy = await privacyPolicyService.createPrivacyPolicy({
        ...validatedData,
        effectiveDate: new Date(validatedData.effectiveDate),
        createdBy: request.headers.get('x-user-id') || 'system',
      });

      return NextResponse.json(
        {
          success: true,
          data: policy,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating privacy policy:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create privacy policy' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 10, windowMs: 60 * 60 * 1000 } // 10 requests per hour
);

/**
 * PUT /api/privacy/policy
 * Update privacy policy
 */
export const PUT = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const policyId = searchParams.get('id');

      if (!policyId) {
        return NextResponse.json(
          { error: 'Policy ID is required' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const validatedData = updatePolicySchema.parse(body);

      const policy = await privacyPolicyService.updatePrivacyPolicy(policyId, {
        ...validatedData,
        effectiveDate: validatedData.effectiveDate
          ? new Date(validatedData.effectiveDate)
          : undefined,
        updatedBy: request.headers.get('x-user-id') || 'system',
      });

      if (!policy) {
        return NextResponse.json(
          { error: 'Privacy policy not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: policy,
      });
    } catch (error) {
      console.error('Error updating privacy policy:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update privacy policy' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 20, windowMs: 60 * 60 * 1000 } // 20 requests per hour
);
