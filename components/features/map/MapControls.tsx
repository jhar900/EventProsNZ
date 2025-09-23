/**
 * Map Controls Component
 * Zoom, pan, and navigation controls for the map
 */

'use client';

import React from 'react';
import { Plus, Minus, RotateCcw, Home, Navigation } from 'lucide-react';
import { useMapStore } from '@/stores/map';
import { MAPBOX_CONFIG } from '@/lib/maps/mapbox-config';

export const MapControls: React.FC = () => {
  const { mapInstance, zoom, setZoom, setCenter, setBounds } = useMapStore();

  const handleZoomIn = () => {
    if (mapInstance) {
      const newZoom = Math.min(zoom + 1, 18);
      setZoom(newZoom);
      mapInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      const newZoom = Math.max(zoom - 1, 1);
      setZoom(newZoom);
      mapInstance.zoomOut();
    }
  };

  const handleReset = () => {
    if (mapInstance) {
      setCenter([
        MAPBOX_CONFIG.DEFAULT_CENTER.lng,
        MAPBOX_CONFIG.DEFAULT_CENTER.lat,
      ]);
      setZoom(MAPBOX_CONFIG.DEFAULT_ZOOM);
      setBounds(MAPBOX_CONFIG.NZ_BOUNDS);

      mapInstance.flyTo({
        center: [
          MAPBOX_CONFIG.DEFAULT_CENTER.lng,
          MAPBOX_CONFIG.DEFAULT_CENTER.lat,
        ],
        zoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
        duration: 1000,
      });
    }
  };

  const handleGoToAuckland = () => {
    if (mapInstance) {
      setCenter([
        MAPBOX_CONFIG.AUCKLAND_CENTER.lng,
        MAPBOX_CONFIG.AUCKLAND_CENTER.lat,
      ]);
      setZoom(MAPBOX_CONFIG.AUCKLAND_ZOOM);

      mapInstance.flyTo({
        center: [
          MAPBOX_CONFIG.AUCKLAND_CENTER.lng,
          MAPBOX_CONFIG.AUCKLAND_CENTER.lat,
        ],
        zoom: MAPBOX_CONFIG.AUCKLAND_ZOOM,
        duration: 1000,
      });
    }
  };

  const handleGeolocate = () => {
    if (mapInstance) {
      // Trigger geolocate control if available
      const geolocateControl = mapInstance.getControl('geolocate');
      if (geolocateControl) {
        geolocateControl.trigger();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 space-y-1">
      {/* Zoom Controls */}
      <div className="flex flex-col space-y-1">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom In"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom Out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-1" />

      {/* Navigation Controls */}
      <div className="flex flex-col space-y-1">
        <button
          onClick={handleReset}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset to New Zealand"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={handleGoToAuckland}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Go to Auckland"
        >
          <Home className="h-4 w-4" />
        </button>
        <button
          onClick={handleGeolocate}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Find My Location"
        >
          <Navigation className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
