/**
 * Proximity Service
 * Handles proximity-based contractor filtering and location services
 */

import { mapService } from '../map-service';

export interface ProximityFilter {
  location: {
    lat: number;
    lng: number;
  };
  radius: number; // in kilometers
  serviceType?: string;
  verifiedOnly?: boolean;
}

export interface ProximityContractor {
  id: string;
  company_name: string;
  business_address: string;
  service_type: string;
  location: {
    lat: number;
    lng: number;
  };
  is_verified: boolean;
  subscription_tier: string;
  distance?: number;
}

export interface LocationSuggestion {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  type: 'address' | 'poi' | 'city';
  formatted_address: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  type: 'radius' | 'polygon';
  coordinates: {
    lat: number;
    lng: number;
  }[];
  radius?: number;
  description?: string;
}

export interface ProximitySearchResult {
  id: string;
  company_name: string;
  business_address: string;
  service_type: string;
  location: {
    lat: number;
    lng: number;
  };
  is_verified: boolean;
  subscription_tier: string;
  distance?: number;
  relevance_score: number;
}

class ProximityService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/map/proximity';
  }

  /**
   * Filter contractors by proximity to a location
   */
  async filterContractors(filter: ProximityFilter): Promise<{
    contractors: ProximityContractor[];
    total: number;
    location: { lat: number; lng: number };
    radius: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('lat', filter.location.lat.toString());
      params.append('lng', filter.location.lng.toString());
      params.append('radius', filter.radius.toString());

      if (filter.serviceType) {
        params.append('service_type', filter.serviceType);
      }

      if (filter.verifiedOnly) {
        params.append('verified_only', 'true');
      }

      const response = await fetch(`${this.baseUrl}/filter?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to filter contractors: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get location suggestions for proximity search
   */
  async getLocationSuggestions(
    query: string,
    bounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    }
  ): Promise<LocationSuggestion[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (bounds) {
        params.append('north', bounds.north.toString());
        params.append('south', bounds.south.toString());
        params.append('east', bounds.east.toString());
        params.append('west', bounds.west.toString());
      }

      const response = await fetch(`${this.baseUrl}/suggestions?${params}`);

      if (!response.ok) {
        throw new Error(
          `Failed to get location suggestions: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get service area coverage for a contractor
   */
  async getServiceAreaCoverage(contractorId: string): Promise<{
    contractor_id: string;
    coverage_areas: ServiceArea[];
    business_location: { lat: number; lng: number } | null;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('contractor_id', contractorId);

      const response = await fetch(`${this.baseUrl}/coverage?${params}`);

      if (!response.ok) {
        throw new Error(
          `Failed to get service area coverage: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search contractors with location-based filtering
   */
  async searchContractors(
    query: string,
    location?: { lat: number; lng: number },
    radius?: number
  ): Promise<{
    results: ProximitySearchResult[];
    total: number;
    query: string;
    location?: { lat: number; lng: number };
    radius?: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (location) {
        params.append('lat', location.lat.toString());
        params.append('lng', location.lng.toString());
      }

      if (radius) {
        params.append('radius', radius.toString());
      }

      const response = await fetch(`${this.baseUrl}/search?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to search contractors: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(
    address: string
  ): Promise<{ lat: number; lng: number } | null> {
    return await mapService.geocodeAddress(address);
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(location: {
    lat: number;
    lng: number;
  }): Promise<string | null> {
    return await mapService.reverseGeocode(location);
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if a location is within a radius of another location
   */
  isWithinRadius(
    center: { lat: number; lng: number },
    point: { lat: number; lng: number },
    radius: number
  ): boolean {
    const distance = this.calculateDistance(center, point);
    return distance <= radius;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   */
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${Math.round(distance * 10) / 10}km`;
  }

  /**
   * Get default radius options for proximity filtering
   */
  getRadiusOptions(): { value: number; label: string }[] {
    return [
      { value: 10, label: '10km' },
      { value: 25, label: '25km' },
      { value: 50, label: '50km' },
      { value: 100, label: '100km' },
      { value: 200, label: '200km' },
    ];
  }
}

export const proximityService = new ProximityService();
