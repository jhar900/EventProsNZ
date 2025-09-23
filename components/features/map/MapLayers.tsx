/**
 * Map Layers Component
 * Layer toggle and options for the map
 */

'use client';

import React, { useState } from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { useMapStore } from '@/stores/map';

interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'base' | 'overlay';
}

export const MapLayers: React.FC = () => {
  const { mapInstance } = useMapStore();
  const [isOpen, setIsOpen] = useState(false);
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'streets', name: 'Streets', visible: true, type: 'base' },
    { id: 'satellite', name: 'Satellite', visible: false, type: 'base' },
    { id: 'terrain', name: 'Terrain', visible: false, type: 'base' },
    { id: 'contractors', name: 'Contractors', visible: true, type: 'overlay' },
    {
      id: 'service-areas',
      name: 'Service Areas',
      visible: false,
      type: 'overlay',
    },
  ]);

  const handleLayerToggle = (layerId: string) => {
    setLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          const newVisible = !layer.visible;

          // Handle base layer switching
          if (layer.type === 'base' && newVisible) {
            // Turn off other base layers
            setLayers(prevLayers =>
              prevLayers.map(l =>
                l.type === 'base' && l.id !== layerId
                  ? { ...l, visible: false }
                  : l
              )
            );

            // Change map style
            if (mapInstance) {
              let styleUrl = 'mapbox://styles/mapbox/streets-v12';
              switch (layerId) {
                case 'satellite':
                  styleUrl = 'mapbox://styles/mapbox/satellite-v9';
                  break;
                case 'terrain':
                  styleUrl = 'mapbox://styles/mapbox/outdoors-v12';
                  break;
                default:
                  styleUrl = 'mapbox://styles/mapbox/streets-v12';
              }

              mapInstance.setStyle(styleUrl);
            }
          }

          return { ...layer, visible: newVisible };
        }
        return layer;
      })
    );
  };

  const baseLayers = layers.filter(layer => layer.type === 'base');
  const overlayLayers = layers.filter(layer => layer.type === 'overlay');

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
        title="Map Layers"
      >
        <Layers className="h-5 w-5" />
      </button>

      {/* Layers Panel */}
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-48">
          <div className="space-y-4">
            {/* Base Layers */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Base Map
              </h3>
              <div className="space-y-1">
                {baseLayers.map(layer => (
                  <label
                    key={layer.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="radio"
                      name="base-layer"
                      checked={layer.visible}
                      onChange={() => handleLayerToggle(layer.id)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{layer.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200" />

            {/* Overlay Layers */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Overlays
              </h3>
              <div className="space-y-1">
                {overlayLayers.map(layer => (
                  <label
                    key={layer.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={() => handleLayerToggle(layer.id)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{layer.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
