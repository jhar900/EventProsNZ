'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  imageLoadTime: number;
  apiResponseTime: number;
  memoryUsage?: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enabled?: boolean;
}

export function PerformanceMonitor({
  onMetricsUpdate,
  enabled = process.env.NODE_ENV === 'development',
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    imageLoadTime: 0,
    apiResponseTime: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();

    // Monitor page load time
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, loadTime }));
    };

    // Monitor image loading performance
    const handleImageLoad = (event: Event) => {
      const img = event.target as HTMLImageElement;
      if (img.complete) {
        const imageLoadTime = performance.now() - startTime;
        setMetrics(prev => ({
          ...prev,
          imageLoadTime: Math.max(prev.imageLoadTime, imageLoadTime),
        }));
      }
    };

    // Monitor memory usage (if available)
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    // Add event listeners
    window.addEventListener('load', handleLoad);
    document.addEventListener('load', handleImageLoad, true);

    // Update memory usage periodically
    const memoryInterval = setInterval(updateMemoryUsage, 5000);

    // Cleanup
    return () => {
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('load', handleImageLoad, true);
      clearInterval(memoryInterval);
    };
  }, [enabled]);

  // Notify parent component of metrics updates
  useEffect(() => {
    if (onMetricsUpdate && enabled) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate, enabled]);

  // Only render in development
  if (!enabled || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="space-y-1">
        <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
        <div>Images: {metrics.imageLoadTime.toFixed(0)}ms</div>
        <div>API: {metrics.apiResponseTime.toFixed(0)}ms</div>
        {metrics.memoryUsage && (
          <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
        )}
      </div>
    </div>
  );
}

// Hook for measuring API response times
export const useApiPerformance = () => {
  const [apiMetrics, setApiMetrics] = useState<Record<string, number>>({});

  const measureApiCall = async <T,>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const responseTime = performance.now() - startTime;
      setApiMetrics(prev => ({ ...prev, [endpoint]: responseTime }));
      return result;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      setApiMetrics(prev => ({ ...prev, [endpoint]: responseTime }));
      throw error;
    }
  };

  return { measureApiCall, apiMetrics };
};

// Hook for measuring image loading performance
export const useImagePerformance = () => {
  const [imageMetrics, setImageMetrics] = useState<Record<string, number>>({});

  const measureImageLoad = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const img = new Image();

      img.onload = () => {
        const loadTime = performance.now() - startTime;
        setImageMetrics(prev => ({ ...prev, [src]: loadTime }));
        resolve();
      };

      img.onerror = () => {
        const loadTime = performance.now() - startTime;
        setImageMetrics(prev => ({ ...prev, [src]: loadTime }));
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  };

  return { measureImageLoad, imageMetrics };
};
