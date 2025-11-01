'use client';

import React, { useState, useEffect, useRef } from 'react';
// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';

interface SimpleMapProps {
  className?: string;
}

export function SimpleMap({ className = '' }: SimpleMapProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [contractors, setContractors] = useState<any[]>([]);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Check configuration
  useEffect(() => {
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

  // Fetch contractors
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        // Fetch contractors with default NZ bounds to get all contractors
        const bounds = {
          north: -34.0,
          south: -47.0,
          east: 179.0,
          west: 166.0,
        };
        const response = await fetch(
          `/api/map/contractors?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}`
        );
        if (response.ok) {
          const data = await response.json();
          setContractors(data.contractors || []);
          console.log(
            'Fetched contractors for map:',
            data.contractors?.length || 0
          );
        }
      } catch (error) {
        console.error('Error fetching contractors:', error);
      }
    };
    if (isConfigured) {
      fetchContractors();
    }
  }, [isConfigured]);

  // Initialize map when configured
  useEffect(() => {
    if (!isConfigured || !mapboxToken || map || !mapContainer.current) {
      return;
    }

    // Add a small delay to ensure the container is rendered
    const timer = setTimeout(() => {
      if (mapContainer.current) {
        try {
          mapboxgl.accessToken = mapboxToken;

          const newMap = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [174.0, -40.5], // Center of New Zealand
            zoom: 5.0, // Zoom level to show all of New Zealand
            maxBounds: [
              [166.0, -47.0], // West, South
              [179.0, -34.0], // East, North
            ],
          });

          newMap.on('load', () => {
            setMapLoaded(true);
            console.log('SimpleMap: Map loaded successfully');

            // Fit the map to show all of New Zealand after it loads
            // This ensures the vertical height of NZ fits within the map area
            newMap.fitBounds(
              [
                [166.0, -47.0], // Southwest corner (West, South)
                [179.0, -34.0], // Northeast corner (East, North)
              ],
              {
                padding: 20,
                duration: 0, // Instant, no animation
              }
            );
          });

          newMap.on('error', (e: any) => {
            console.error('Map error:', e.error?.message || 'Unknown error');
          });

          setMap(newMap);

          // Add navigation controls
          newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
        } catch (error) {
          console.error('Map initialization error:', error);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map) {
        (map as any).remove();
      }
    };
  }, [isConfigured, mapboxToken, map]);

  // Add markers for contractors when map and contractors are loaded
  useEffect(() => {
    if (!map || !mapLoaded || contractors.length === 0) return;

    // Store markers so we can clean them up
    const markers: any[] = [];

    console.log('Adding markers for contractors:', contractors.length);

    // Add markers for each contractor
    contractors.forEach(contractor => {
      // API returns location with lat/lng (not latitude/longitude)
      if (
        contractor.location &&
        contractor.location.lat &&
        contractor.location.lng
      ) {
        // Create a popup with contractor info
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2">
            <h3 class="font-semibold text-sm mb-1">${contractor.company_name || 'Unnamed'}</h3>
            <p class="text-xs text-gray-600 mb-1">${contractor.service_type || 'Service provider'}</p>
            ${contractor.business_address ? `<p class="text-xs text-gray-500">${contractor.business_address}</p>` : ''}
            ${contractor.is_verified ? '<span class="text-xs text-green-600 font-medium">✓ Verified</span>' : ''}
          </div>`
        );

        // Create and add marker with orange color to match brand
        const marker = new mapboxgl.Marker({
          color: '#f97316', // Orange color
          scale: 0.8,
        })
          .setLngLat([contractor.location.lng, contractor.location.lat])
          .setPopup(popup)
          .addTo(map);

        markers.push(marker);
      } else {
        console.warn('Contractor missing location:', contractor);
      }
    });

    // Don't auto-fit - keep showing all of New Zealand
    // Markers will be visible but map stays at NZ-wide view

    // Cleanup function - remove markers when component unmounts or dependencies change
    return () => {
      markers.forEach(marker => {
        if (marker && marker.remove) {
          marker.remove();
        }
      });
    };
  }, [map, mapLoaded, contractors]);

  if (isLoading) {
    return (
      <div
        className={`w-full bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{
          minHeight: '600px',
          height: '600px',
        }}
      >
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  if (!isConfigured || !mapboxToken) {
    return (
      <div
        className={`w-full bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{
          minHeight: '600px',
          height: '600px',
        }}
      >
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Map Not Configured
          </div>
          <div className="text-gray-600 text-sm">
            Please set NEXT_PUBLIC_MAPBOX_TOKEN environment variable
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-xl overflow-hidden border border-gray-200 ${className}`}
    >
      <div
        ref={mapContainer}
        className="w-full rounded-xl"
        style={{
          minHeight: '600px',
          width: '100%',
          height: '600px',
        }}
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
          <div className="text-gray-600">Loading map...</div>
        </div>
      )}
    </div>
  );
}
