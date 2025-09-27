import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom error classes for better error handling
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: any[]) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
    this.name = 'DatabaseError';
  }
}

/**
 * Security logging for error tracking
 */
export class SecurityLogger {
  /**
   * Log security-related errors
   * @param error - The error object
   * @param req - The request object
   * @param metadata - Additional metadata
   */
  static async logSecurityError(
    error: Error,
    req: NextRequest,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        ip: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
      },
      metadata,
    };

    // In production, send to security monitoring service
  }

  /**
   * Log suspicious activity
   * @param activity - Description of the activity
   * @param req - The request object
   * @param severity - Severity level
   */
  static async logSuspiciousActivity(
    activity: string,
    req: NextRequest,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      type: 'suspicious_activity',
      severity,
      activity,
      request: {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        ip: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
      },
    };
  }
}

/**
 * Performance logging for error tracking
 */
export class PerformanceLogger {
  /**
   * Log performance-related errors
   * @param error - The error object
   * @param req - The request object
   * @param duration - Request duration in milliseconds
   */
  static async logPerformanceError(
    error: Error,
    req: NextRequest,
    duration: number
  ): Promise<void> {
    const performanceEvent = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
      },
      request: {
        method: req.method,
        url: req.url,
        duration,
      },
    };
  }
}

/**
 * Error handler middleware
 * Provides centralized error handling and logging
 */
export class ErrorHandler {
  /**
   * Handle different types of errors
   * @param error - The error object
   * @param req - The request object
   * @returns Formatted error response
   */
  static handleError(error: Error, req: NextRequest): NextResponse {
    // Log the error
    .toISOString(),
    });

    // Handle specific error types
    if (error instanceof AppError) {
      return this.handleAppError(error, req);
    }

    // Handle validation errors
    if (error.name === 'ZodError') {
      return this.handleValidationError(error, req);
    }

    // Handle database errors
    if (
      error.message.includes('database') ||
      error.message.includes('connection')
    ) {
      return this.handleDatabaseError(error, req);
    }

    // Handle authentication errors
    if (error.message.includes('auth') || error.message.includes('token')) {
      return this.handleAuthenticationError(error, req);
    }

    // Handle rate limiting errors
    if (
      error.message.includes('rate limit') ||
      error.message.includes('too many')
    ) {
      return this.handleRateLimitError(error, req);
    }

    // Handle unknown errors
    return this.handleUnknownError(error, req);
  }

  /**
   * Handle application-specific errors
   */
  private static handleAppError(
    error: AppError,
    req: NextRequest
  ): NextResponse {
    // Log security errors
    if (
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError
    ) {
      SecurityLogger.logSecurityError(error, req, {
        type: 'authentication_error',
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: {
          name: error.name,
          statusCode: error.statusCode,
        },
      },
      { status: error.statusCode }
    );
  }

  /**
   * Handle validation errors
   */
  private static handleValidationError(
    error: any,
    req: NextRequest
  ): NextResponse {
    SecurityLogger.logSuspiciousActivity(
      'Invalid input data received',
      req,
      'medium'
    );

    return NextResponse.json(
      {
        success: false,
        message: 'Validation failed',
        errors: error.errors || [],
      },
      { status: 400 }
    );
  }

  /**
   * Handle database errors
   */
  private static handleDatabaseError(
    error: Error,
    req: NextRequest
  ): NextResponse {
    PerformanceLogger.logPerformanceError(error, req, 0);

    return NextResponse.json(
      {
        success: false,
        message: 'Database operation failed',
        error: {
          name: 'DatabaseError',
          statusCode: 500,
        },
      },
      { status: 500 }
    );
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthenticationError(
    error: Error,
    req: NextRequest
  ): NextResponse {
    SecurityLogger.logSecurityError(error, req, {
      type: 'authentication_error',
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Authentication failed',
        error: {
          name: 'AuthenticationError',
          statusCode: 401,
        },
      },
      { status: 401 }
    );
  }

  /**
   * Handle rate limiting errors
   */
  private static handleRateLimitError(
    error: Error,
    req: NextRequest
  ): NextResponse {
    SecurityLogger.logSuspiciousActivity('Rate limit exceeded', req, 'high');

    return NextResponse.json(
      {
        success: false,
        message: 'Too many requests',
        error: {
          name: 'RateLimitError',
          statusCode: 429,
        },
      },
      { status: 429 }
    );
  }

  /**
   * Handle unknown errors
   */
  private static handleUnknownError(
    error: Error,
    req: NextRequest
  ): NextResponse {
    SecurityLogger.logSecurityError(error, req, {
      type: 'unknown_error',
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: {
          name: 'InternalServerError',
          statusCode: 500,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Middleware wrapper for error handling
 * @param handler - The API handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling(
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return ErrorHandler.handleError(error as Error, req);
    }
  };
}

/**
 * Utility function to create standardized error responses
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param details - Additional error details
 * @returns NextResponse with error
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      error: {
        statusCode,
        details,
      },
    },
    { status: statusCode }
  );
}

/**
 * Utility function to create success responses
 * @param data - Response data
 * @param message - Success message
 * @param statusCode - HTTP status code
 * @returns NextResponse with success
 */
export function createSuccessResponse(
  data: any,
  message: string = 'Success',
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status: statusCode }
  );
}
