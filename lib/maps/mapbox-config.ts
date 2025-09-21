/**
 * Mapbox Configuration
 * Centralized configuration for Mapbox services
 */

export const MAPBOX_CONFIG = {
  // Default map style for New Zealand
  DEFAULT_STYLE: "mapbox://styles/mapbox/streets-v12",

  // New Zealand centered view
  DEFAULT_CENTER: {
    lng: 174.886, // Auckland longitude
    lat: -40.9006, // New Zealand latitude
  },

  // Default zoom level for New Zealand
  DEFAULT_ZOOM: 5,

  // Auckland centered view for detailed maps
  AUCKLAND_CENTER: {
    lng: 174.7633,
    lat: -36.8485,
  },

  // Auckland zoom level
  AUCKLAND_ZOOM: 10,

  // Map bounds for New Zealand
  NZ_BOUNDS: {
    north: -34.0,
    south: -47.0,
    east: 179.0,
    west: 166.0,
  },

  // Mapbox access token (from environment)
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",

  // Geocoding API configuration
  GEOCODING: {
    country: "NZ", // Restrict to New Zealand
    types: "address,poi,place",
    limit: 5,
  },

  // Directions API configuration
  DIRECTIONS: {
    profile: "driving",
    alternatives: false,
    geometries: "geojson",
    steps: true,
    overview: "simplified",
  },
} as const;

export type MapboxConfig = typeof MAPBOX_CONFIG;
