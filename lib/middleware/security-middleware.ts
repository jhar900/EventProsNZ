import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleAuthError } from './auth';

/**
 * Security middleware wrapper that adds authentication to API routes
 * @param handler - The API route handler function
 * @returns Wrapped handler with security checks
 */
export function withSecurity<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Authenticate the request
      const { user } = await authenticateRequest(request);

      // Add user info to request headers for downstream handlers
      request.headers.set('x-user-id', user.id);
      request.headers.set('x-user-email', user.email);
      request.headers.set('x-user-role', user.role);

      // Call the original handler
      return await handler(request, ...args);
    } catch (error) {
      console.error('Security middleware error:', error);
      return handleAuthError(error);
    }
  };
}

/**
 * Security middleware for admin-only routes
 * @param handler - The API route handler function
 * @returns Wrapped handler with admin security checks
 */
export function withAdminSecurity<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Authenticate the request
      const { user } = await authenticateRequest(request);

      // Check if user is admin
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }

      // Add user info to request headers for downstream handlers
      request.headers.set('x-user-id', user.id);
      request.headers.set('x-user-email', user.email);
      request.headers.set('x-user-role', user.role);

      // Call the original handler
      return await handler(request, ...args);
    } catch (error) {
      console.error('Admin security middleware error:', error);
      return handleAuthError(error);
    }
  };
}

/**
 * Security middleware for contractor-only routes
 * @param handler - The API route handler function
 * @returns Wrapped handler with contractor security checks
 */
export function withContractorSecurity<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Authenticate the request
      const { user } = await authenticateRequest(request);

      // Check if user is contractor or admin
      if (!['contractor', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { error: 'Contractor access required' },
          { status: 403 }
        );
      }

      // Add user info to request headers for downstream handlers
      request.headers.set('x-user-id', user.id);
      request.headers.set('x-user-email', user.email);
      request.headers.set('x-user-role', user.role);

      // Call the original handler
      return await handler(request, ...args);
    } catch (error) {
      console.error('Contractor security middleware error:', error);
      return handleAuthError(error);
    }
  };
}
