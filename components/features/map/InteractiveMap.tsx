/**
 * Interactive Map Component
 * Main map component with Mapbox integration
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMapbox } from '@/lib/maps/mapbox-context';
import { useMapStore } from '@/stores/map';
import { MapLoading } from './MapLoading';
import { MapControls } from './MapControls';
import { MapLayers } from './MapLayers';
import { MapLegend } from './MapLegend';
import { ContractorPin } from './ContractorPin';
import { PinCluster } from './PinCluster';
import { MapTooltip } from './MapTooltip';
import { OfflineIndicator } from './OfflineIndicator';
// Import Mapbox CSS directly as fallback
import 'mapbox-gl/dist/mapbox-gl.css';

interface InteractiveMapProps {
  className?: string;
  showControls?: boolean;
  showLayers?: boolean;
  showLegend?: boolean;
  onContractorSelect?: (contractorId: string) => void;
  onMapReady?: (map: any) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  className = '',
  showControls = true,
  showLayers = true,
  showLegend = true,
  onContractorSelect,
  onMapReady,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { isLoaded, mapboxgl, error: mapboxError } = useMapbox();
  const {
    mapInstance,
    contractors,
    selectedContractor,
    isLoading,
    error,
    isOffline,
    zoom,
    bounds,
    filters,
    initializeMap,
    selectContractor,
    clearError,
  } = useMapStore();

  const [mapReady, setMapReady] = useState(false);

  // Initialize map when Mapbox is loaded and container has dimensions
  // Similar approach to /maps-demo page
  useEffect(() => {
    if (isLoaded && mapboxgl && mapContainerRef.current && !mapInstance) {
      const container = mapContainerRef.current;

      // Wait for container to be laid out - use requestAnimationFrame for better timing
      const initializeWhenReady = () => {
        if (!container) return;

        // Force a layout calculation
        container.offsetHeight;

        // Get dimensions from multiple sources
        const rect = container.getBoundingClientRect();
        let width =
          rect.width || container.offsetWidth || container.clientWidth || 0;
        let height =
          rect.height || container.offsetHeight || container.clientHeight || 0;

        // If no dimensions, try parent
        if ((width === 0 || height === 0) && container.parentElement) {
          const parentRect = container.parentElement.getBoundingClientRect();
          if (parentRect.width > 0 && parentRect.height > 0) {
            width = parentRect.width;
            height = parentRect.height;
            container.style.width = `${width}px`;
            container.style.height = `${height}px`;
            // Force layout
            container.offsetHeight;
          }
        }

        // If still no dimensions, use computed styles from parent
        if ((width === 0 || height === 0) && container.parentElement) {
          const computed = window.getComputedStyle(container.parentElement);
          const parentWidth = parseFloat(computed.width);
          const parentHeight = parseFloat(computed.height);
          if (parentWidth > 0 && parentHeight > 0) {
            width = parentWidth;
            height = parentHeight;
            container.style.width = `${width}px`;
            container.style.height = `${height}px`;
            container.offsetHeight;
          }
        }

        // Final check - if still no dimensions, use fallback
        if (width === 0 || height === 0) {
          console.warn(
            'InteractiveMap: Container has no dimensions, using fallback'
          );
          width = 500;
          height = 400;
          container.style.width = `${width}px`;
          container.style.height = `${height}px`;
          container.offsetHeight;
        }

        // Always set explicit dimensions
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        container.style.display = 'block';
        container.style.position = 'relative';
        // Force layout
        container.offsetWidth;
        container.offsetHeight;

        console.log('InteractiveMap: Initializing map with container:', {
          width,
          height,
          styleWidth: container.style.width,
          styleHeight: container.style.height,
          rectWidth: rect.width,
          rectHeight: rect.height,
        });

        // Initialize map
        initializeMap(container);
      };

      // Use requestAnimationFrame to ensure container is laid out
      let timeoutId: NodeJS.Timeout | null = null;
      const rafId = requestAnimationFrame(() => {
        const rafId2 = requestAnimationFrame(() => {
          // Add a small delay as fallback
          timeoutId = setTimeout(initializeWhenReady, 50);
        });
        return () => cancelAnimationFrame(rafId2);
      });

      return () => {
        cancelAnimationFrame(rafId);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [isLoaded, mapboxgl, mapInstance, initializeMap, clearError]);

  // Handle map ready callback
  useEffect(() => {
    if (mapInstance && !mapReady) {
      setMapReady(true);
      onMapReady?.(mapInstance);
    }
  }, [mapInstance, mapReady, onMapReady]);

  // Handle contractor selection
  const handleContractorSelect = (contractorId: string) => {
    selectContractor(contractorId);
    onContractorSelect?.(contractorId);
  };

  // Handle map click to clear selection
  const handleMapClick = () => {
    selectContractor(null);
  };

  // Add click event listener to map
  useEffect(() => {
    if (mapInstance) {
      mapInstance.on('click', handleMapClick);

      return () => {
        mapInstance.off('click', handleMapClick);
      };
    }
  }, [mapInstance]);

  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <MapLoading />
      </div>
    );
  }

  // Show error state
  if (mapboxError || error) {
    const errorMessage = mapboxError || error || 'Unknown error';
    const isTokenError =
      errorMessage.toLowerCase().includes('token') ||
      errorMessage.toLowerCase().includes('access');

    return (
      <div
        className={`relative w-full h-full flex items-center justify-center ${className}`}
      >
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Map Error
          </div>
          <div className="text-gray-600 mb-4 text-sm">{errorMessage}</div>
          {isTokenError && (
            <div className="text-xs text-gray-500 mb-4 p-3 bg-gray-100 rounded">
              <p className="font-semibold mb-1">Troubleshooting:</p>
              <ul className="text-left space-y-1 list-disc list-inside">
                <li>Verify NEXT_PUBLIC_MAPBOX_TOKEN is set in Vercel</li>
                <li>Ensure the token starts with &quot;pk.&quot;</li>
                <li>Redeploy after adding/updating the variable</li>
                <li>Check browser console for detailed errors</li>
              </ul>
            </div>
          )}
          <button
            onClick={clearError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        minWidth: '100%',
        minHeight: '100%',
      }}
    >
      {/* Map Container - This div becomes the Mapbox container */}
      {/* Using the same structure as /maps-demo page for consistency */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '384px',
        }}
      />

      {/* Map Controls */}
      {showControls && mapReady && (
        <div className="absolute top-4 left-4 z-10">
          <MapControls />
        </div>
      )}

      {/* Map Layers */}
      {showLayers && mapReady && (
        <div className="absolute top-4 right-4 z-10">
          <MapLayers />
        </div>
      )}

      {/* Map Legend */}
      {showLegend && mapReady && (
        <div className="absolute bottom-4 left-4 z-10">
          <MapLegend />
        </div>
      )}

      {/* Offline Indicator */}
      {isOffline && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <OfflineIndicator />
        </div>
      )}

      {/* Enhanced Pin Clusters with Individual Pins */}
      {mapReady && (
        <PinCluster
          contractors={contractors}
          onContractorSelect={handleContractorSelect}
          zoom={zoom}
          bounds={bounds}
          filters={filters}
        />
      )}

      {/* Map Tooltip */}
      {mapReady && selectedContractor && (
        <MapTooltip
          contractorId={selectedContractor}
          onClose={() => selectContractor(null)}
        />
      )}
    </div>
  );
};
