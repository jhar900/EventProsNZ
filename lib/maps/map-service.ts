/**
 * Map Service
 * Handles map data operations and contractor location management
 */

import { MAPBOX_CONFIG } from './mapbox-config';

export interface MapContractor {
  id: string;
  company_name: string;
  description?: string | null;
  business_address: string;
  service_type: string;
  location: {
    lat: number;
    lng: number;
  };
  logo_url?: string | null;
  is_verified: boolean;
  subscription_tier: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapLocation {
  lat: number;
  lng: number;
}

export interface MapSearchResult {
  id: string;
  name: string;
  location: MapLocation;
  type: 'contractor' | 'address' | 'poi';
}

export interface MapFilters {
  service_type?: string;
  verified_only?: boolean;
  subscription_tier?: string;
}

class MapService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/map';
  }

  /**
   * Get contractors within map bounds
   */
  async getContractors(
    bounds: MapBounds,
    filters?: MapFilters
  ): Promise<MapContractor[]> {
    try {
      const params = new URLSearchParams();
      params.append('north', bounds.north.toString());
      params.append('south', bounds.south.toString());
      params.append('east', bounds.east.toString());
      params.append('west', bounds.west.toString());

      if (filters?.service_type) {
        params.append('service_type', filters.service_type);
      }
      if (filters?.verified_only) {
        params.append('verified_only', 'true');
      }
      if (filters?.subscription_tier) {
        params.append('subscription_tier', filters.subscription_tier);
      }

      const response = await fetch(`${this.baseUrl}/contractors?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch contractors: ${response.statusText}`);
      }

      const data = await response.json();
      return data.contractors || [];
    } catch (error) {
      // Re-throw error without logging
      throw error;
    }
  }

  /**
   * Get contractor location details
   */
  async getContractorLocation(
    contractorId: string
  ): Promise<{ location: MapLocation; address: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/contractors/${contractorId}/location`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch contractor location: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      // Re-throw error without logging
      throw error;
    }
  }

  /**
   * Search for locations and contractors
   */
  async searchMap(
    query: string,
    bounds?: MapBounds
  ): Promise<MapSearchResult[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (bounds) {
        params.append('north', bounds.north.toString());
        params.append('south', bounds.south.toString());
        params.append('east', bounds.east.toString());
        params.append('west', bounds.west.toString());
      }

      const response = await fetch(`${this.baseUrl}/search?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to search map: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      // Re-throw error without logging
      throw error;
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<MapLocation | null> {
    try {
      if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
        throw new Error('Mapbox access token not configured');
      }

      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?` +
          `access_token=${MAPBOX_CONFIG.ACCESS_TOKEN}&` +
          `country=${MAPBOX_CONFIG.GEOCODING.country}&` +
          `types=${MAPBOX_CONFIG.GEOCODING.types}&` +
          `limit=${MAPBOX_CONFIG.GEOCODING.limit}`
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }

      return null;
    } catch (error) {
      // Handle geocoding error silently
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(location: MapLocation): Promise<string | null> {
    try {
      if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
        throw new Error('Mapbox access token not configured');
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.lng},${location.lat}.json?` +
          `access_token=${MAPBOX_CONFIG.ACCESS_TOKEN}&` +
          `country=${MAPBOX_CONFIG.GEOCODING.country}&` +
          `types=${MAPBOX_CONFIG.GEOCODING.types}`
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }

      return null;
    } catch (error) {
      // Handle reverse geocoding error silently
      return null;
    }
  }

  /**
   * Check if coordinates are within New Zealand bounds
   */
  isWithinNZBounds(location: MapLocation): boolean {
    const { north, south, east, west } = MAPBOX_CONFIG.NZ_BOUNDS;
    return (
      location.lat >= south &&
      location.lat <= north &&
      location.lng >= west &&
      location.lng <= east
    );
  }

  /**
   * Get default New Zealand bounds
   */
  getNZBounds(): MapBounds {
    return { ...MAPBOX_CONFIG.NZ_BOUNDS };
  }
}

export const mapService = new MapService();
