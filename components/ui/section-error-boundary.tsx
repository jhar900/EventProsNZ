'use client';

import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { Card } from './card';
import { Button } from './button';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName: string;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function SectionErrorBoundary({
  children,
  sectionName,
  fallback,
  onError,
}: SectionErrorBoundaryProps) {
  const defaultFallback = (
    <Card className="p-6 border-orange-200 bg-orange-50">
      <div className="text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-orange-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-orange-800 mb-2">
          {sectionName} Section Error
        </h3>
        <p className="text-orange-600 mb-4">
          There was an error loading the {sectionName.toLowerCase()} section.
          This section will be hidden to prevent affecting the rest of the page.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          className="border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    </Card>
  );

  return (
    <ErrorBoundary
      fallback={fallback || defaultFallback}
      onError={onError}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
}
