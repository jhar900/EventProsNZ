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
    initializeMap,
    selectContractor,
    clearError,
  } = useMapStore();

  const [mapReady, setMapReady] = useState(false);

  // Initialize map when Mapbox is loaded
  useEffect(() => {
    if (isLoaded && mapboxgl && mapContainerRef.current && !mapInstance) {
      initializeMap(mapContainerRef.current);
    }
  }, [isLoaded, mapboxgl, mapInstance, initializeMap]);

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
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center ${className}`}
      >
        <div className="text-center p-6">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Map Error
          </div>
          <div className="text-gray-600 mb-4">{mapboxError || error}</div>
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
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
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
