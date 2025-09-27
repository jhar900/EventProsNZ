import { createClient } from '@/lib/supabase/server';
import { LocationMatch } from '@/types/matching';

export class LocationService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Calculate location match between event and contractor
   */
  async calculateLocationMatch(
    eventLocation: { lat: number; lng: number; address?: string },
    contractorServiceAreas: string[]
  ): Promise<LocationMatch> {
    try {
      // Calculate distance (simplified - would use actual geospatial calculations)
      const distanceKm = this.calculateDistance(eventLocation, {
        lat: 0,
        lng: 0,
      }); // Mock calculation

      // Calculate service area coverage
      const serviceAreaCoverage = contractorServiceAreas.length > 0 ? 1 : 0;

      // Calculate proximity score
      const proximityScore =
        distanceKm < 10 ? 1 : Math.max(0, 1 - distanceKm / 100);

      // Calculate accessibility score
      const accessibilityScore = this.calculateAccessibilityScore(
        eventLocation,
        contractorServiceAreas
      );

      // Calculate overall score
      const overallScore =
        serviceAreaCoverage * 0.4 +
        proximityScore * 0.4 +
        accessibilityScore * 0.2;

      return {
        distance_km: distanceKm,
        service_area_coverage: serviceAreaCoverage,
        proximity_score: proximityScore,
        accessibility_score: accessibilityScore,
        overall_score: Math.min(1, Math.max(0, overallScore)),
      };
    } catch (error) {
      throw new Error('Failed to calculate location match');
    }
  }

  /**
   * Get contractors within a specific radius
   */
  async getContractorsInRadius(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<{ contractor_id: string; distance_km: number }[]> {
    try {
      // This would typically use PostGIS or similar for geospatial queries
      // For now, return mock data
      const mockContractors = [
        { contractor_id: 'contractor-1', distance_km: 5.2 },
        { contractor_id: 'contractor-2', distance_km: 12.8 },
        { contractor_id: 'contractor-3', distance_km: 25.1 },
      ];

      return mockContractors.filter(c => c.distance_km <= radiusKm);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get service areas for a contractor
   */
  async getContractorServiceAreas(contractorId: string): Promise<string[]> {
    try {
      const { data: businessProfile, error } = await this.supabase
        .from('business_profiles')
        .select('service_areas')
        .eq('user_id', contractorId)
        .single();

      if (error || !businessProfile) {
        return [];
      }

      return businessProfile.service_areas || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if contractor covers a specific location
   */
  async checkLocationCoverage(
    contractorId: string,
    eventLocation: { lat: number; lng: number; address?: string }
  ): Promise<boolean> {
    try {
      const serviceAreas = await this.getContractorServiceAreas(contractorId);

      if (serviceAreas.length === 0) {
        return false;
      }

      // Simplified check - would implement actual geospatial logic
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get location recommendations based on event requirements
   */
  async getLocationRecommendations(
    eventType: string,
    attendeeCount: number,
    budget: number
  ): Promise<{
    recommended_locations: {
      name: string;
      address: string;
      suitability_score: number;
    }[];
    location_factors: { factor: string; importance: number }[];
  }> {
    try {
      // Mock location recommendations
      const recommended_locations = [
        {
          name: 'Downtown Convention Center',
          address: '123 Main St, City',
          suitability_score: 0.9,
        },
        {
          name: 'Garden Venue',
          address: '456 Park Ave, City',
          suitability_score: 0.8,
        },
        {
          name: 'Hotel Ballroom',
          address: '789 Hotel Blvd, City',
          suitability_score: 0.7,
        },
      ];

      const location_factors = [
        { factor: 'Accessibility', importance: 0.3 },
        { factor: 'Parking', importance: 0.25 },
        { factor: 'Capacity', importance: 0.2 },
        { factor: 'Cost', importance: 0.15 },
        { factor: 'Amenities', importance: 0.1 },
      ];

      return {
        recommended_locations,
        location_factors,
      };
    } catch (error) {
      throw new Error('Failed to get location recommendations');
    }
  }

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLng = this.deg2rad(point2.lng - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(point1.lat)) *
        Math.cos(this.deg2rad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateAccessibilityScore(
    eventLocation: { lat: number; lng: number; address?: string },
    serviceAreas: string[]
  ): number {
    // Simplified accessibility calculation
    // Would consider public transport, parking, etc.
    return 0.8;
  }
}

export const locationService = new LocationService();
