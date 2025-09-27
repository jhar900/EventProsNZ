'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Analytics Error
            </h2>
            <p className="text-red-600 mb-4">
              Something went wrong while loading the analytics data.
            </p>
            <div className="space-x-4">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-2 bg-red-100 text-xs text-red-800 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

// Higher-order component for wrapping analytics components
export function withAnalyticsErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <AnalyticsErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AnalyticsErrorBoundary>
    );
  };
}

// Specific error boundary for analytics charts
export function AnalyticsChartErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AnalyticsErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-600">Chart failed to load</p>
            <p className="text-sm text-gray-500">
              Please try refreshing the page
            </p>
          </div>
        </div>
      }
    >
      {children}
    </AnalyticsErrorBoundary>
  );
}

// Specific error boundary for analytics tables
export function AnalyticsTableErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AnalyticsErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-32 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <div className="text-gray-400 text-3xl mb-2">📋</div>
            <p className="text-gray-600">Table failed to load</p>
            <p className="text-sm text-gray-500">
              Please try refreshing the page
            </p>
          </div>
        </div>
      }
    >
      {children}
    </AnalyticsErrorBoundary>
  );
}
