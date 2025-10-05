/**
 * Maps Demo Page
 * Test page for Mapbox integration
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export default function MapsDemoPage() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    // Load Mapbox CSS dynamically
    const loadMapboxCSS = async () => {
      try {
        await import('mapbox-gl/dist/mapbox-gl.css');
      } catch (error) {
        console.warn('Failed to load Mapbox CSS:', error);
      }
    };

    loadMapboxCSS();

    const checkConfiguration = async () => {
      try {
        const response = await fetch('/api/maps/check-config');
        const data = await response.json();
        setIsConfigured(data.configured);
      } catch (error) {
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkConfiguration();
  }, []);

  // Initialize map when configured
  useEffect(() => {
    if (isConfigured && mapboxToken && !map) {
      // Add a small delay to ensure the container is rendered
      const timer = setTimeout(() => {
        if (mapContainer.current) {
          try {
            mapboxgl.accessToken = mapboxToken;
            addResult('🔄 Initializing map...');

            const newMap = new mapboxgl.Map({
              container: mapContainer.current,
              style: 'mapbox://styles/mapbox/streets-v12',
              center: [174.7633, -36.8485], // Auckland, New Zealand
              zoom: 10,
            });

            newMap.on('load', () => {
              setMapLoaded(true);
              addResult('✅ Map loaded successfully!');
            });

            newMap.on('error', e => {
              addResult(
                '❌ Map error: ' + (e.error?.message || 'Unknown error')
              );
            });

            newMap.on('style.load', () => {
              addResult('✅ Map style loaded!');
            });

            setMap(newMap);

            // Add navigation controls
            newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
          } catch (error) {
            addResult(
              '❌ Map initialization error: ' + (error as Error).message
            );
          }
        } else {
          addResult('❌ Map container not found');
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (map) {
          (map as any).remove();
        }
      };
    }

    return undefined;
  }, [isConfigured, mapboxToken, map]);

  // Geocoding function
  const searchAddress = async (query: string) => {
    if (!query.trim() || !mapboxToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxToken}&country=nz&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      addResult('❌ Geocoding error: ' + (error as Error).message);
    }
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      searchAddress(query);
    } else {
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: any) => {
    setSelectedLocation(suggestion);
    setSearchQuery(suggestion.place_name);
    setSuggestions([]);

    if (map) {
      map.flyTo({
        center: suggestion.center,
        zoom: 15,
      });

      // Add marker
      new mapboxgl.Marker().setLngLat(suggestion.center).addTo(map);
    }

    addResult(`✅ Location selected: ${suggestion.place_name}`);
  };

  const addResult = (message: string) => {
    setTestResults(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const handleTestMapbox = () => {
    addResult('Testing Mapbox integration...');
    if (isConfigured) {
      addResult('✅ Mapbox token is configured and ready to use!');
    } else {
      addResult('❌ Mapbox token is NOT configured.');
    }
  };

  const handleTestMapRendering = () => {
    addResult('Testing map rendering...');
    addResult(`Map container exists: ${!!mapContainer.current}`);
    addResult(`Map instance exists: ${!!map}`);
    addResult(`Map loaded: ${mapLoaded}`);
    addResult(`Mapbox token exists: ${!!mapboxToken}`);

    if (mapContainer.current) {
      const rect = mapContainer.current.getBoundingClientRect();
      addResult(`Container dimensions: ${rect.width}x${rect.height}`);
    }

    if (mapLoaded) {
      addResult('✅ Map is rendered and interactive!');
    } else if (map) {
      addResult('⏳ Map is loading...');
    } else {
      addResult('❌ Map failed to render.');
    }
  };

  const handleTestGeocoding = () => {
    addResult('Testing geocoding API...');
    if (searchQuery.length > 2) {
      searchAddress(searchQuery);
      addResult('✅ Geocoding request sent!');
    } else {
      addResult('❌ Please enter a search query first.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Maps Integration Demo
          </h1>
          <p className="text-gray-600">
            Test the Mapbox integration components for Event Pros NZ
          </p>
        </div>

        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isLoading
                  ? 'bg-gray-400'
                  : isConfigured
                    ? 'bg-green-500'
                    : 'bg-red-500'
              }`}
            ></div>
            <span className="text-sm">
              Mapbox (
              {isLoading
                ? 'Checking...'
                : isConfigured
                  ? 'Configured'
                  : 'Not Configured'}
              )
            </span>
          </div>
          {!isLoading && isConfigured && (
            <p className="text-sm text-gray-600 mt-2">
              Mapbox token is properly configured and ready to use!
            </p>
          )}
          {!isLoading && !isConfigured && (
            <p className="text-sm text-gray-500 mt-2">
              Please set NEXT_PUBLIC_MAPBOX_TOKEN environment variable to test
              map functionality.
            </p>
          )}
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Mapbox Token</h3>
            <button
              onClick={handleTestMapbox}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Run Test
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Map Rendering</h3>
            <button
              onClick={handleTestMapRendering}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured}
            >
              Test Map
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Test Geocoding</h3>
            <button
              onClick={handleTestGeocoding}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConfigured || searchQuery.length < 3}
            >
              Test Search
            </button>
          </div>
        </div>

        {/* Interactive Map and Search */}
        {isConfigured && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Map Container */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Interactive Map</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for a location in New Zealand:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Enter address, city, or landmark..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm">
                            {suggestion.place_name}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div
                ref={mapContainer}
                className="w-full h-96 rounded-md border border-gray-300"
                style={{
                  minHeight: '384px',
                  width: '100%',
                  height: '384px',
                }}
              />
              {selectedLocation && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <h4 className="font-medium text-blue-900">
                    Selected Location:
                  </h4>
                  <p className="text-sm text-blue-700">
                    {selectedLocation.place_name}
                  </p>
                  <p className="text-xs text-blue-600">
                    Coordinates: {selectedLocation.center[1].toFixed(4)},{' '}
                    {selectedLocation.center[0].toFixed(4)}
                  </p>
                </div>
              )}
            </div>

            {/* Map Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Map Status</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isConfigured ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></div>
                  <span className="text-sm">
                    Token: {isConfigured ? 'Configured' : 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      mapLoaded
                        ? 'bg-green-500'
                        : map
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                    }`}
                  ></div>
                  <span className="text-sm">
                    Map:{' '}
                    {mapLoaded
                      ? 'Loaded'
                      : map
                        ? 'Loading...'
                        : 'Not initialized'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      suggestions.length > 0 ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></div>
                  <span className="text-sm">
                    Geocoding:{' '}
                    {suggestions.length > 0
                      ? `${suggestions.length} results`
                      : 'No search'}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  Instructions:
                </h3>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Type an address in the search box</li>
                  <li>2. Select from the dropdown suggestions</li>
                  <li>3. Watch the map fly to the location</li>
                  <li>4. A marker will be placed on the map</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-100 rounded-md p-4 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1">
                  {result}
                </div>
              ))}
            </div>
            <button
              onClick={() => setTestResults([])}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
