'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LocationMapProps {
  coordinates?: { lat: number; lng: number };
  address?: string;
  className?: string;
}

export function LocationMap({
  coordinates,
  address,
  className = '',
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geocodedCoordinates, setGeocodedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Geocode address if coordinates are missing
  useEffect(() => {
    if (
      address &&
      (!coordinates || (coordinates.lat === 0 && coordinates.lng === 0))
    ) {
      setIsGeocoding(true);
      const geocodeAddress = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&countrycodes=nz`
          );

          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              setGeocodedCoordinates({
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              });
            }
          }
        } catch (err) {
          console.error('Error geocoding address:', err);
        } finally {
          setIsGeocoding(false);
        }
      };

      geocodeAddress();
    }
  }, [address, coordinates]);

  // Use geocoded coordinates if available, otherwise use provided coordinates
  const finalCoordinates = geocodedCoordinates || coordinates;

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) {
      setIsLoading(false);
      if (!mapboxToken) {
        setError('Map not configured');
      }
      return;
    }

    // Only initialize if coordinates are valid
    if (
      !finalCoordinates ||
      (finalCoordinates.lat === 0 && finalCoordinates.lng === 0)
    ) {
      setIsLoading(false);
      return;
    }

    // Dynamically import mapbox-gl
    const initMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;

        // Dynamically load CSS
        if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
          const link = document.createElement('link');
          link.href =
            'https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }

        mapboxgl.accessToken = mapboxToken;

        // Initialize map
        const map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [finalCoordinates.lng, finalCoordinates.lat],
          zoom: 14,
          interactive: true,
          attributionControl: false,
        });

        // Hide Mapbox logo with CSS
        map.on('style.load', () => {
          const mapboxLogo = map
            .getContainer()
            .querySelector('.mapboxgl-ctrl-logo');
          if (mapboxLogo) {
            (mapboxLogo as HTMLElement).style.display = 'none';
          }
        });

        mapRef.current = map;

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add marker
        const marker = new mapboxgl.Marker({
          color: '#ef4444', // red-500
          draggable: false,
        })
          .setLngLat([finalCoordinates.lng, finalCoordinates.lat])
          .addTo(map);

        markerRef.current = marker;

        map.on('load', () => {
          setIsLoading(false);
          // Hide Mapbox logo and attribution
          const logo = map.getContainer().querySelector('.mapboxgl-ctrl-logo');
          const attrib = map
            .getContainer()
            .querySelector('.mapboxgl-ctrl-attrib');
          if (logo) {
            (logo as HTMLElement).style.display = 'none';
          }
          if (attrib) {
            (attrib as HTMLElement).style.display = 'none';
          }
        });

        map.on('error', (e: any) => {
          console.error('Map error:', e);
          setError('Failed to load map');
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [finalCoordinates?.lat, finalCoordinates?.lng, mapboxToken]);

  // Update marker position if coordinates change
  useEffect(() => {
    if (
      mapRef.current &&
      markerRef.current &&
      finalCoordinates &&
      finalCoordinates.lat !== 0 &&
      finalCoordinates.lng !== 0
    ) {
      mapRef.current.flyTo({
        center: [finalCoordinates.lng, finalCoordinates.lat],
        zoom: 14,
        duration: 1000,
      });
      markerRef.current.setLngLat([finalCoordinates.lng, finalCoordinates.lat]);
    }
  }, [finalCoordinates?.lat, finalCoordinates?.lng]);

  // Hide Mapbox logo and attribution
  useEffect(() => {
    if (!mapRef.current) return;

    const hideLogo = () => {
      const container = mapRef.current?.getContainer();
      if (container) {
        const logo = container.querySelector(
          '.mapboxgl-ctrl-logo'
        ) as HTMLElement;
        const attrib = container.querySelector(
          '.mapboxgl-ctrl-attrib'
        ) as HTMLElement;
        if (logo) logo.style.display = 'none';
        if (attrib) attrib.style.display = 'none';
      }
    };

    // Hide immediately if map is already loaded
    hideLogo();

    // Also hide after a short delay to catch late-loading elements
    const timeout = setTimeout(hideLogo, 100);
    const timeout2 = setTimeout(hideLogo, 500);

    // Listen for style changes
    mapRef.current.on('style.load', hideLogo);

    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
      if (mapRef.current) {
        mapRef.current.off('style.load', hideLogo);
      }
    };
  }, [mapRef.current, isLoading]);

  if (!mapboxToken) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center ${className}`}
        style={{ height: '200px' }}
      >
        <p className="text-sm text-muted-foreground">Map not configured</p>
      </div>
    );
  }

  if (
    !finalCoordinates ||
    (finalCoordinates.lat === 0 && finalCoordinates.lng === 0)
  ) {
    if (isGeocoding) {
      return (
        <div
          className={`relative rounded-lg border border-gray-200 overflow-hidden ${className}`}
          style={{ height: '200px' }}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading map...</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className={`relative rounded-lg border border-gray-200 overflow-hidden ${className}`}
      style={{ height: '200px' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
