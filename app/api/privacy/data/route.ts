import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataExportService } from '@/lib/privacy/data-export-service';
import { UserRightsService } from '@/lib/privacy/user-rights-service';
import { withSecurity } from '@/lib/middleware/security-middleware';
import { withRateLimit } from '@/lib/rate-limiting';

const dataExportService = new DataExportService();
const userRightsService = new UserRightsService();

// Validation schemas
const getDataSchema = z.object({
  userId: z.string().uuid(),
  format: z.enum(['json', 'csv', 'xml']).optional().default('json'),
  includeSensitive: z.boolean().optional().default(false),
});

const exportDataSchema = z.object({
  userId: z.string().uuid(),
  format: z.enum(['json', 'csv', 'xml']).optional().default('json'),
  includeSensitive: z.boolean().optional().default(false),
  reason: z.string().max(500).optional(),
});

const deleteDataSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().max(500).optional(),
  confirmDeletion: z.boolean(),
});

/**
 * GET /api/privacy/data
 * Get user data (data access request)
 */
export const GET = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const format = searchParams.get('format') as
        | 'json'
        | 'csv'
        | 'xml'
        | null;
      const includeSensitive = searchParams.get('includeSensitive') === 'true';

      const validatedParams = getDataSchema.parse({
        userId: userId || undefined,
        format: format || 'json',
        includeSensitive,
      });

      if (!validatedParams.userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      // Create a data access request
      const rightsRequest = await userRightsService.createRightsRequest({
        userId: validatedParams.userId,
        requestType: 'access',
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: request.headers.get('x-user-id') || 'system',
      });

      // Process the data access request
      const userData = await userRightsService.processDataAccessRequest(
        rightsRequest.id,
        validatedParams.userId
      );

      // Format the data based on requested format
      let formattedData;
      switch (validatedParams.format) {
        case 'csv':
          formattedData = dataExportService.formatUserData(userData, 'csv');
          break;
        case 'xml':
          formattedData = dataExportService.formatUserData(userData, 'xml');
          break;
        default:
          formattedData = userData;
      }

      return NextResponse.json({
        success: true,
        data: {
          requestId: rightsRequest.id,
          userData: formattedData,
          format: validatedParams.format,
          exportedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error getting user data:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request parameters', details: error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to get user data' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 10, windowMs: 60 * 60 * 1000 } // 10 requests per hour
);

/**
 * POST /api/privacy/data
 * Export user data (data portability request)
 */
export const POST = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = exportDataSchema.parse(body);

      // Create a data portability request
      const rightsRequest = await userRightsService.createRightsRequest({
        userId: validatedData.userId,
        requestType: 'portability',
        status: 'pending',
        requestData: {
          format: validatedData.format,
          includeSensitive: validatedData.includeSensitive,
          reason: validatedData.reason,
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: request.headers.get('x-user-id') || 'system',
      });

      // Process the data portability request
      const exportData = await userRightsService.processDataPortabilityRequest(
        rightsRequest.id,
        validatedData.userId,
        validatedData.format
      );

      // Create export record
      const exportRecord = await dataExportService.createExportRequest({
        userId: validatedData.userId,
        format: validatedData.format,
        status: 'completed',
        filePath: `exports/${validatedData.userId}_${Date.now()}.${validatedData.format}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdBy: request.headers.get('x-user-id') || 'system',
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            requestId: rightsRequest.id,
            exportId: exportRecord.id,
            downloadUrl: `/api/privacy/data/download/${exportRecord.id}`,
            expiresAt: exportRecord.expiresAt,
            format: validatedData.format,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error exporting user data:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to export user data' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 5, windowMs: 60 * 60 * 1000 } // 5 requests per hour
);

/**
 * DELETE /api/privacy/data
 * Delete user data (right to erasure)
 */
export const DELETE = withSecurity(
  withRateLimit(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = deleteDataSchema.parse(body);

      if (!validatedData.confirmDeletion) {
        return NextResponse.json(
          { error: 'Deletion must be confirmed' },
          { status: 400 }
        );
      }

      // Create a data erasure request
      const rightsRequest = await userRightsService.createRightsRequest({
        userId: validatedData.userId,
        requestType: 'erasure',
        status: 'pending',
        requestData: {
          reason: validatedData.reason,
          confirmed: true,
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: request.headers.get('x-user-id') || 'system',
      });

      // Process the data erasure request
      const success = await userRightsService.processDataErasureRequest(
        rightsRequest.id,
        validatedData.userId
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to process data erasure request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          requestId: rightsRequest.id,
          message: 'Data erasure request processed successfully',
          processedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error deleting user data:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to delete user data' },
        { status: 500 }
      );
    }
  }),
  { maxRequests: 2, windowMs: 24 * 60 * 60 * 1000 } // 2 requests per day
);
