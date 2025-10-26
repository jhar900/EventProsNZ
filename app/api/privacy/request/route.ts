import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRightsService } from '@/lib/privacy/user-rights-service';
import { GDPRComplianceService } from '@/lib/privacy/gdpr-compliance-service';
import { withSecurity } from '@/lib/middleware/security-middleware';
import { withRateLimit } from '@/lib/rate-limiting';

const userRightsService = new UserRightsService();
const gdprService = new GDPRComplianceService();

// Validation schemas
const submitRequestSchema = z.object({
  userId: z.string().uuid(),
  requestType: z.enum([
    'access',
    'rectification',
    'erasure',
    'portability',
    'restriction',
    'objection',
    'complaint',
  ]),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional()
    .default('medium'),
  requestData: z.any().optional(),
  attachments: z.array(z.string()).optional(),
});

const updateRequestSchema = z.object({
  status: z
    .enum(['pending', 'in_progress', 'completed', 'rejected', 'cancelled'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional(),
  response: z.string().max(2000).optional(),
  notes: z.string().max(1000).optional(),
});

const getRequestsSchema = z.object({
  userId: z.string().uuid().optional(),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'rejected', 'cancelled'])
    .optional(),
  requestType: z
    .enum([
      'access',
      'rectification',
      'erasure',
      'portability',
      'restriction',
      'objection',
      'complaint',
    ])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

/**
 * GET /api/privacy/request
 * Get privacy requests
 */
export const GET = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const requestId = searchParams.get('id');

      if (requestId) {
        // Get specific request
        const rightsRequest =
          await userRightsService.getRightsRequest(requestId);

        if (!rightsRequest) {
          return NextResponse.json(
            { error: 'Privacy request not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: rightsRequest,
        });
      } else {
        // Get filtered requests
        const validatedParams = getRequestsSchema.parse({
          userId: searchParams.get('userId') || undefined,
          status: (searchParams.get('status') as any) || undefined,
          requestType: (searchParams.get('requestType') as any) || undefined,
          priority: (searchParams.get('priority') as any) || undefined,
          assignedTo: searchParams.get('assignedTo') || undefined,
          limit: searchParams.get('limit')
            ? parseInt(searchParams.get('limit')!)
            : undefined,
          offset: searchParams.get('offset')
            ? parseInt(searchParams.get('offset')!)
            : undefined,
        });

        let requests;
        if (validatedParams.userId) {
          requests = await userRightsService.getUserRightsRequests(
            validatedParams.userId,
            validatedParams.limit,
            validatedParams.offset
          );
        } else {
          // For admin users, get all requests
          // This would need to be implemented in the service
          requests = [];
        }

        // Apply additional filters
        if (validatedParams.status) {
          requests = requests.filter(
            req => req.status === validatedParams.status
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            requests,
            total: requests.length,
            limit: validatedParams.limit,
            offset: validatedParams.offset,
          },
        });
      }
    } catch (error) {
      console.error('Error getting privacy requests:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request parameters', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to get privacy requests' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 100, windowMs: 15 * 60 * 1000 } // 100 requests per 15 minutes
);

/**
 * POST /api/privacy/request
 * Submit new privacy request
 */
export const POST = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = submitRequestSchema.parse(body);

      // Create the rights request
      const rightsRequest = await userRightsService.createRightsRequest({
        userId: validatedData.userId,
        requestType: validatedData.requestType as any,
        status: 'pending',
        requestData: {
          subject: validatedData.subject,
          description: validatedData.description,
          priority: validatedData.priority,
          attachments: validatedData.attachments,
          ...validatedData.requestData,
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: request.headers.get('x-user-id') || 'system',
      });

      // Log GDPR compliance event
      await gdprService.logViolation({
        type: 'data_subject_request',
        severity: 'low',
        description: `Data subject request submitted: ${validatedData.requestType}`,
        affectedData: validatedData.requestData,
        detectedAt: new Date(),
        resolvedAt: null,
        createdBy: request.headers.get('x-user-id') || 'system',
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            requestId: rightsRequest.id,
            status: rightsRequest.status,
            message: 'Privacy request submitted successfully',
            estimatedProcessingTime: '3-5 business days',
          },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error submitting privacy request:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to submit privacy request' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 10, windowMs: 60 * 60 * 1000 } // 10 requests per hour
);

/**
 * PUT /api/privacy/request
 * Update privacy request
 */
export const PUT = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const requestId = searchParams.get('id');

      if (!requestId) {
        return NextResponse.json(
          { error: 'Request ID is required' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const validatedData = updateRequestSchema.parse(body);

      // Update the rights request
      const updatedRequest = await userRightsService.updateRightsRequestStatus(
        requestId,
        (validatedData.status as any) || 'pending',
        validatedData.response,
        validatedData.notes
      );

      if (!updatedRequest) {
        return NextResponse.json(
          { error: 'Privacy request not found' },
          { status: 404 }
        );
      }

      // Log GDPR compliance event if status changed
      if (validatedData.status) {
        await gdprService.logViolation({
          type: 'data_subject_request_updated',
          severity: 'low',
          description: `Data subject request status updated to: ${validatedData.status}`,
          affectedData: { requestId, newStatus: validatedData.status },
          detectedAt: new Date(),
          resolvedAt: validatedData.status === 'completed' ? new Date() : null,
          createdBy: request.headers.get('x-user-id') || 'system',
        });
      }

      return NextResponse.json({
        success: true,
        data: updatedRequest,
      });
    } catch (error) {
      console.error('Error updating privacy request:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update privacy request' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 30, windowMs: 15 * 60 * 1000 } // 30 requests per 15 minutes
);

/**
 * DELETE /api/privacy/request
 * Cancel privacy request
 */
export const DELETE = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const requestId = searchParams.get('id');

      if (!requestId) {
        return NextResponse.json(
          { error: 'Request ID is required' },
          { status: 400 }
        );
      }

      // Update request status to cancelled
      const updatedRequest = await userRightsService.updateRightsRequestStatus(
        requestId,
        'rejected', // Using rejected status for cancelled requests
        null,
        'Request cancelled by user'
      );

      if (!updatedRequest) {
        return NextResponse.json(
          { error: 'Privacy request not found' },
          { status: 404 }
        );
      }

      // Log GDPR compliance event
      await gdprService.logViolation({
        type: 'data_subject_request_cancelled',
        severity: 'low',
        description: 'Data subject request cancelled by user',
        affectedData: { requestId },
        detectedAt: new Date(),
        resolvedAt: new Date(),
        createdBy: request.headers.get('x-user-id') || 'system',
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Privacy request cancelled successfully',
          requestId: updatedRequest.id,
        },
      });
    } catch (error) {
      console.error('Error cancelling privacy request:', error);

      return NextResponse.json(
        { error: 'Failed to cancel privacy request' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 10, windowMs: 60 * 60 * 1000 } // 10 requests per hour
);
