'use client';

import { useState, useEffect, useRef } from 'react';
import { useMapbox } from '@/lib/maps/mapbox-context';
import { MAPBOX_CONFIG } from '@/lib/maps/mapbox-config';

interface ServiceAreaMappingProps {
  serviceAreas: string[];
  onChange: (areas: string[]) => void;
  coverageType: 'regions' | 'nationwide';
  onCoverageTypeChange: (type: 'regions' | 'nationwide') => void;
}

const NZ_REGIONS = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Napier',
  'Dunedin',
  'Palmerston North',
  'Nelson',
  'Rotorua',
  'Invercargill',
  'Whangarei',
  'New Plymouth',
  'Whanganui',
  'Gisborne',
  'Timaru',
  'Pukekohe',
  'Masterton',
  'Levin',
  'Ashburton',
];

export function ServiceAreaMapping({
  serviceAreas,
  onChange,
  coverageType,
  onCoverageTypeChange,
}: ServiceAreaMappingProps) {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(serviceAreas);
  const [map, setMap] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const { isLoaded, mapboxgl } = useMapbox();

  useEffect(() => {
    if (!isLoaded || !mapboxgl || !mapContainer.current) return;

    // Initialize map
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.DEFAULT_STYLE,
      center: MAPBOX_CONFIG.DEFAULT_CENTER,
      zoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
      maxBounds: [
        [MAPBOX_CONFIG.NZ_BOUNDS.west, MAPBOX_CONFIG.NZ_BOUNDS.south],
        [MAPBOX_CONFIG.NZ_BOUNDS.east, MAPBOX_CONFIG.NZ_BOUNDS.north],
      ],
    });

    mapInstance.on('load', () => {
      setIsMapLoaded(true);
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, [isLoaded, mapboxgl]);

  const handleAreaToggle = (area: string) => {
    const newAreas = selectedAreas.includes(area)
      ? selectedAreas.filter(a => a !== area)
      : [...selectedAreas, area];

    setSelectedAreas(newAreas);
    onChange(newAreas);
  };

  const handleCoverageTypeChange = (type: 'regions' | 'nationwide') => {
    onCoverageTypeChange(type);
    if (type === 'nationwide') {
      setSelectedAreas(['Nationwide']);
      onChange(['Nationwide']);
    } else {
      setSelectedAreas([]);
      onChange([]);
    }
  };

  const selectAllRegions = () => {
    const allRegions = NZ_REGIONS;
    setSelectedAreas(allRegions);
    onChange(allRegions);
  };

  const clearAllRegions = () => {
    setSelectedAreas([]);
    onChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Coverage Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Service Coverage
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="coverageType"
              value="regions"
              checked={coverageType === 'regions'}
              onChange={() => handleCoverageTypeChange('regions')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">
              Specific regions in New Zealand
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="coverageType"
              value="nationwide"
              checked={coverageType === 'nationwide'}
              onChange={() => handleCoverageTypeChange('nationwide')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">
              Nationwide coverage
            </span>
          </label>
        </div>
      </div>

      {/* Region Selection */}
      {coverageType === 'regions' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Service Areas *
            </label>
            <div className="space-x-2">
              <button
                type="button"
                onClick={selectAllRegions}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllRegions}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
            {NZ_REGIONS.map(region => (
              <label key={region} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAreas.includes(region)}
                  onChange={() => handleAreaToggle(region)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{region}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Map Visualization */}
      {coverageType === 'regions' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Area Map
          </label>
          <div
            ref={mapContainer}
            className="w-full h-64 border border-gray-300 rounded-md"
          />
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
              <div className="text-gray-500">Loading map...</div>
            </div>
          )}
        </div>
      )}

      {/* Selected Areas Summary */}
      {selectedAreas.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Areas ({selectedAreas.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedAreas.map(area => (
              <span
                key={area}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {area}
                <button
                  type="button"
                  onClick={() => handleAreaToggle(area)}
                  className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                >
                  <span className="sr-only">Remove</span>
                  <svg
                    className="h-2 w-2"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 8 8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeWidth="1.5"
                      d="m1 1 6 6m0-6-6 6"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
