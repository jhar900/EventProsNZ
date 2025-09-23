/**
 * Map Loading Component
 * Loading states and spinners for map operations
 */

'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface MapLoadingProps {
  message?: string;
  className?: string;
}

export const MapLoading: React.FC<MapLoadingProps> = ({
  message = 'Loading map...',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full bg-gray-50 ${className}`}
    >
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <div className="text-gray-600 text-sm font-medium">{message}</div>
      </div>
    </div>
  );
};
