import React from 'react';
import LoadingSpinner from './loading-spinner';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingState({
  message = 'Loading...',
  size = 'md',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 ${className}`}
    >
      <LoadingSpinner size={size} className="mb-4" />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}
