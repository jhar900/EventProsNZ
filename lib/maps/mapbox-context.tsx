/**
 * Mapbox Context Provider
 * Provides Mapbox functionality throughout the application
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { MAPBOX_CONFIG } from "./mapbox-config";

interface MapboxContextType {
  isLoaded: boolean;
  mapboxgl: any;
  error: string | null;
}

const MapboxContext = createContext<MapboxContextType | undefined>(undefined);

export const useMapbox = () => {
  const context = useContext(MapboxContext);
  if (context === undefined) {
    throw new Error("useMapbox must be used within a MapboxProvider");
  }
  return context;
};

interface MapboxProviderProps {
  children: React.ReactNode;
}

export const MapboxProvider: React.FC<MapboxProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMapbox = async () => {
      try {
        // Check if Mapbox token is available
        if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
          setIsLoaded(true); // Still mark as loaded but without mapbox
          return;
        }

        // Dynamically import Mapbox GL JS with error handling
        let mapboxgl;
        try {
          mapboxgl = await import("mapbox-gl");
          } catch (importError) {
          setError(`Failed to import Mapbox GL JS: ${importError}`);
          setIsLoaded(true);
          return;
        }

        // Check if mapboxgl has the expected structure
        if (!mapboxgl || !mapboxgl.default) {
          setError("Unexpected mapbox-gl import structure");
          setIsLoaded(true);
          return;
        }

        // Set the access token
        mapboxgl.default.accessToken = MAPBOX_CONFIG.ACCESS_TOKEN;

        setMapboxgl(mapboxgl.default);
        setIsLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load Mapbox");
        setIsLoaded(true); // Still mark as loaded even if mapbox fails
      }
    };

    // Only load on client side
    if (typeof window !== "undefined") {
      loadMapbox();
    } else {
      setIsLoaded(true);
    }
  }, []);

  const value: MapboxContextType = {
    isLoaded,
    mapboxgl,
    error,
  };

  return (
    <MapboxContext.Provider value={value}>{children}</MapboxContext.Provider>
  );
};
