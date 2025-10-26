import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRightsService } from '@/lib/privacy/user-rights-service';
import { withSecurity } from '@/lib/middleware/security-middleware';
import { withRateLimit } from '@/lib/rate-limiting';
import { withCache } from '@/lib/cache/cache-middleware';

const userRightsService = new UserRightsService();

// Validation schemas
const getRightsSchema = z.object({
  userId: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'rejected'])
    .optional(),
});

const createRightsRequestSchema = z.object({
  userId: z.string().uuid(),
  requestType: z.enum([
    'access',
    'rectification',
    'erasure',
    'portability',
    'restriction',
    'objection',
  ]),
  requestData: z.any().optional(),
  notes: z.string().max(1000).optional(),
});

const updateRightsRequestSchema = z.object({
  status: z
    .enum(['pending', 'in_progress', 'completed', 'rejected'])
    .optional(),
  responseData: z.any().optional(),
  notes: z.string().max(1000).optional(),
});

const processRightsRequestSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'process']),
  responseData: z.any().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * GET /api/privacy/rights
 * Get user rights information
 */
export const GET = withSecurity(
  withRateLimit(
    withCache(async (request: NextRequest) => {
      try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const requestId = searchParams.get('requestId');
        const status = searchParams.get('status');

        const validatedParams = getRightsSchema.parse({
          userId: userId || undefined,
          requestId: requestId || undefined,
          status: (status as any) || undefined,
        });

        if (requestId) {
          // Get specific rights request
          const rightsRequest =
            await userRightsService.getRightsRequest(requestId);

          if (!rightsRequest) {
            return NextResponse.json(
              { error: 'Rights request not found' },
              { status: 404 }
            );
          }

          return NextResponse.json({
            success: true,
            data: rightsRequest,
          });
        } else if (userId) {
          // Get all rights requests for a user
          const rightsRequests =
            await userRightsService.getUserRightsRequests(userId);

          // Filter by status if provided
          const filteredRequests = validatedParams.status
            ? rightsRequests.filter(
                req => req.status === validatedParams.status
              )
            : rightsRequests;

          return NextResponse.json({
            success: true,
            data: filteredRequests,
          });
        } else {
          // Get user's data subject rights
          const userId = request.headers.get('x-user-id');
          if (!userId) {
            return NextResponse.json(
              { error: 'User ID is required' },
              { status: 400 }
            );
          }

          const dataSubjectRights =
            await userRightsService.getDataSubjectRights(userId);

          return NextResponse.json({
            success: true,
            data: dataSubjectRights,
          });
        }
      } catch (error) {
        console.error('Error getting user rights:', error);

        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request parameters', details: error.errors },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to get user rights' },
          { status: 500 }
        );
      }
    }),
    { maxRequests: 100, windowMs: 15 * 60 * 1000 } // 100 requests per 15 minutes
  )
);

/**
 * POST /api/privacy/rights
 * Create new rights request
 */
export const POST = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = createRightsRequestSchema.parse(body);

      const rightsRequest = await userRightsService.createRightsRequest({
        ...validatedData,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: request.headers.get('x-user-id') || 'system',
      });

      return NextResponse.json(
        {
          success: true,
          data: rightsRequest,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating rights request:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create rights request' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 20, windowMs: 60 * 60 * 1000 } // 20 requests per hour
);

/**
 * PUT /api/privacy/rights
 * Update rights request or process request
 */
export const PUT = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const requestId = searchParams.get('id');
      const action = searchParams.get('action');

      if (!requestId) {
        return NextResponse.json(
          { error: 'Request ID is required' },
          { status: 400 }
        );
      }

      const body = await request.json();

      if (action === 'process') {
        const validatedData = processRightsRequestSchema.parse(body);

        let updatedRequest;
        if (validatedData.action === 'approve') {
          updatedRequest = await userRightsService.updateRightsRequestStatus(
            requestId,
            'in_progress',
            validatedData.responseData,
            validatedData.notes
          );
        } else if (validatedData.action === 'reject') {
          updatedRequest = await userRightsService.updateRightsRequestStatus(
            requestId,
            'rejected',
            validatedData.responseData,
            validatedData.notes
          );
        } else {
          // Process the request based on its type
          const rightsRequest =
            await userRightsService.getRightsRequest(requestId);
          if (!rightsRequest) {
            return NextResponse.json(
              { error: 'Rights request not found' },
              { status: 404 }
            );
          }

          let result;
          switch (rightsRequest.requestType) {
            case 'access':
              result = await userRightsService.processDataAccessRequest(
                requestId,
                rightsRequest.userId
              );
              break;
            case 'rectification':
              result = await userRightsService.processDataRectificationRequest(
                requestId,
                rightsRequest.userId,
                rightsRequest.requestData
              );
              break;
            case 'erasure':
              result = await userRightsService.processDataErasureRequest(
                requestId,
                rightsRequest.userId
              );
              break;
            case 'portability':
              result = await userRightsService.processDataPortabilityRequest(
                requestId,
                rightsRequest.userId,
                rightsRequest.requestData?.format || 'json'
              );
              break;
            default:
              throw new Error('Unsupported request type');
          }

          updatedRequest = await userRightsService.getRightsRequest(requestId);
        }

        return NextResponse.json({
          success: true,
          data: updatedRequest,
        });
      } else {
        const validatedData = updateRightsRequestSchema.parse(body);

        const updatedRequest =
          await userRightsService.updateRightsRequestStatus(
            requestId,
            validatedData.status || 'pending',
            validatedData.responseData,
            validatedData.notes
          );

        if (!updatedRequest) {
          return NextResponse.json(
            { error: 'Rights request not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedRequest,
        });
      }
    } catch (error) {
      console.error('Error updating rights request:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update rights request' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 30, windowMs: 15 * 60 * 1000 } // 30 requests per 15 minutes
);
