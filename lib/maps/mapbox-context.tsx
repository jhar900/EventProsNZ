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
      console.log("🔄 Starting MapboxProvider initialization...");

      try {
        // Check if Mapbox token is available
        if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
          console.warn("⚠️ Mapbox access token is not configured");
          setIsLoaded(true); // Still mark as loaded but without mapbox
          return;
        }

        console.log("✅ Mapbox token found, attempting to import mapbox-gl...");

        // Dynamically import Mapbox GL JS with error handling
        let mapboxgl;
        try {
          console.log("📦 Importing mapbox-gl...");
          mapboxgl = await import("mapbox-gl");
          console.log("✅ mapbox-gl imported successfully");
        } catch (importError) {
          console.error("❌ Failed to import mapbox-gl:", importError);
          setError(`Failed to import Mapbox GL JS: ${importError}`);
          setIsLoaded(true);
          return;
        }

        // Check if mapboxgl has the expected structure
        if (!mapboxgl || !mapboxgl.default) {
          console.error(
            "❌ mapbox-gl import structure is unexpected:",
            mapboxgl
          );
          setError("Unexpected mapbox-gl import structure");
          setIsLoaded(true);
          return;
        }

        console.log("🔑 Setting Mapbox access token...");
        // Set the access token
        mapboxgl.default.accessToken = MAPBOX_CONFIG.ACCESS_TOKEN;

        console.log("✅ Mapbox configured successfully");
        setMapboxgl(mapboxgl.default);
        setIsLoaded(true);
      } catch (err) {
        console.error("❌ Failed to load Mapbox:", err);
        setError(err instanceof Error ? err.message : "Failed to load Mapbox");
        setIsLoaded(true); // Still mark as loaded even if mapbox fails
      }
    };

    // Only load on client side
    if (typeof window !== "undefined") {
      console.log("🌐 Client-side detected, loading Mapbox...");
      loadMapbox();
    } else {
      console.log("🖥️ Server-side detected, skipping Mapbox load");
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
