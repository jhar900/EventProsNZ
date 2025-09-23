'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  retryDelay?: number;
  maxRetries?: number;
  className?: string;
}

interface AsyncErrorState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

export function AsyncErrorBoundary({
  children,
  fallback,
  onRetry,
  retryDelay = 1000,
  maxRetries = 3,
  className = '',
}: AsyncErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<AsyncErrorState>({
    hasError: false,
    error: null,
    retryCount: 0,
    isRetrying: false,
  });

  const resetError = () => {
    setErrorState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  const handleRetry = async () => {
    if (errorState.retryCount >= maxRetries) {
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
    }));

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // Call custom retry handler if provided
    if (onRetry) {
      try {
        await onRetry();
        resetError();
      } catch (error) {
        setErrorState(prev => ({
          hasError: true,
          error: error instanceof Error ? error : new Error(String(error)),
          retryCount: prev.retryCount + 1,
          isRetrying: false,
        }));
      }
    } else {
      // Default retry behavior - just reset the error state
      resetError();
    }
  };

  // Error handler for async operations
  const handleAsyncError = (error: Error) => {
    setErrorState({
      hasError: true,
      error,
      retryCount: errorState.retryCount,
      isRetrying: false,
    });
  };

  // Enhanced children with error handling
  const childrenWithErrorHandling = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onError: handleAsyncError,
        ...child.props,
      });
    }
    return child;
  });

  if (errorState.hasError) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    const canRetry = errorState.retryCount < maxRetries;

    return (
      <Card className={`p-6 border-red-200 bg-red-50 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Failed to Load Content
          </h3>
          <p className="text-red-600 mb-4">
            {errorState.error?.message ||
              'An error occurred while loading this content.'}
          </p>

          {errorState.retryCount > 0 && (
            <p className="text-sm text-red-500 mb-4">
              Retry attempt {errorState.retryCount} of {maxRetries}
            </p>
          )}

          <div className="flex gap-2 justify-center">
            {canRetry && (
              <Button
                onClick={handleRetry}
                disabled={errorState.isRetrying}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                {errorState.isRetrying ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Retrying...
                  </div>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return <div className={className}>{childrenWithErrorHandling}</div>;
}

// Hook for components to report async errors
export const useAsyncError = () => {
  const [error, setError] = useState<Error | null>(null);

  const reportError = (error: Error) => {
    setError(error);
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { reportError, clearError };
};
