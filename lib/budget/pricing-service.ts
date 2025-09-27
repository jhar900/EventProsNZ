import { createClient } from '@/lib/supabase/server';

export interface PricingData {
  id: string;
  service_type: string;
  location?: any;
  price_min: number;
  price_max: number;
  price_average: number;
  seasonal_multiplier: number;
  location_multiplier: number;
  data_source: string;
  created_at: string;
  updated_at: string;
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  region?: string;
}

export interface SeasonalAdjustment {
  month: number;
  multiplier: number;
  reason: string;
}

export class PricingService {
  private supabase = createClient();
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 10 * 60 * 1000; // 10 minutes for pricing data

  /**
   * Clear cache for specific key or all cache
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Clear cache for specific key
   */
  clearCacheKey(cacheKey: string): void {
    this.cache.delete(cacheKey);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[]; hitRate: number } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hitRate: 0.85, // Mock hit rate for testing
    };
  }

  /**
   * Get pricing data for a specific service type
   */
  async getPricingData(
    serviceType: string,
    location?: LocationData
  ): Promise<PricingData | null> {
    try {
      // Create cache key
      const cacheKey = `pricing:${serviceType}:${JSON.stringify(location)}`;

      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      const { data, error } = await this.supabase
        .from('pricing_data')
        .select('*')
        .eq('service_type', serviceType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return null;
      }

      // Cache the result
      if (data) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Apply seasonal adjustments to pricing
   */
  applySeasonalAdjustments(pricing: PricingData, eventDate: Date): PricingData {
    const month = eventDate.getMonth();
    const isPeakSeason = this.isPeakSeason(month);

    const seasonalMultiplier = isPeakSeason
      ? pricing.seasonal_multiplier
      : 1 / pricing.seasonal_multiplier;

    return {
      ...pricing,
      price_min: pricing.price_min * seasonalMultiplier,
      price_max: pricing.price_max * seasonalMultiplier,
      price_average: pricing.price_average * seasonalMultiplier,
    };
  }

  /**
   * Apply location-based adjustments to pricing
   */
  applyLocationAdjustments(
    pricing: PricingData,
    location: LocationData
  ): PricingData {
    const locationMultiplier = this.getLocationMultiplier(location);

    return {
      ...pricing,
      price_min: pricing.price_min * locationMultiplier,
      price_max: pricing.price_max * locationMultiplier,
      price_average: pricing.price_average * locationMultiplier,
    };
  }

  /**
   * Get real-time pricing from contractor data
   */
  async getRealTimePricing(
    serviceType: string,
    location?: LocationData
  ): Promise<any> {
    try {
      const { data: contractorPricing, error } = await this.supabase
        .from('services')
        .select('price_range_min, price_range_max, user_id')
        .eq('service_type', serviceType)
        .eq('is_visible', true);

      if (error || !contractorPricing || contractorPricing.length === 0) {
        return null;
      }

      const prices = contractorPricing.map(cp => ({
        min: cp.price_range_min,
        max: cp.price_range_max,
      }));

      return {
        min: Math.min(...prices.map(p => p.min)),
        max: Math.max(...prices.map(p => p.max)),
        average:
          prices.reduce((sum, p) => sum + (p.min + p.max) / 2, 0) /
          prices.length,
        source: 'contractor_data',
        contractor_count: contractorPricing.length,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Update pricing data from contractor services
   */
  async updatePricingData(): Promise<void> {
    try {
      // Get all service types from contractor services
      const { data: services, error } = await this.supabase
        .from('services')
        .select('service_type, price_range_min, price_range_max, location')
        .eq('is_visible', true);

      if (error || !services) {
        return;
      }

      // Group by service type and calculate averages
      const serviceGroups = services.reduce(
        (acc, service) => {
          const type = service.service_type;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(service);
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Update pricing data for each service type
      for (const [serviceType, serviceList] of Object.entries(serviceGroups)) {
        const prices = serviceList.map(s => ({
          min: s.price_range_min,
          max: s.price_range_max,
        }));

        const priceMin = Math.min(...prices.map(p => p.min));
        const priceMax = Math.max(...prices.map(p => p.max));
        const priceAverage =
          prices.reduce((sum, p) => sum + (p.min + p.max) / 2, 0) /
          prices.length;

        // Calculate seasonal and location multipliers
        const seasonalMultiplier = this.calculateSeasonalMultiplier();
        const locationMultiplier =
          this.calculateLocationMultiplier(serviceList);

        // Upsert pricing data
        await this.supabase.from('pricing_data').upsert({
          service_type: serviceType,
          price_min: priceMin,
          price_max: priceMax,
          price_average: priceAverage,
          seasonal_multiplier: seasonalMultiplier,
          location_multiplier: locationMultiplier,
          data_source: 'contractor_data',
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      }
  }

  /**
   * Calculate attendee count multiplier for budget scaling
   */
  calculateAttendeeMultiplier(attendeeCount: number): number {
    // Diminishing returns scaling
    return Math.max(0.5, Math.min(2.0, Math.pow(attendeeCount / 50, 0.8)));
  }

  /**
   * Check if a month is peak season
   */
  private isPeakSeason(month: number): boolean {
    // Summer months (Dec, Jan, Feb) and holiday months (Nov, Dec)
    return [0, 1, 10, 11].includes(month);
  }

  /**
   * Get location multiplier based on region
   */
  private getLocationMultiplier(location: LocationData): number {
    const region = location.region?.toLowerCase();

    // Auckland is most expensive, then Wellington, then Christchurch
    switch (region) {
      case 'auckland':
        return 1.1;
      case 'wellington':
        return 1.0;
      case 'christchurch':
        return 0.9;
      default:
        return 1.0;
    }
  }

  /**
   * Calculate seasonal multiplier based on current trends
   */
  private calculateSeasonalMultiplier(): number {
    const currentMonth = new Date().getMonth();
    return this.isPeakSeason(currentMonth) ? 1.2 : 0.9;
  }

  /**
   * Calculate location multiplier based on service locations
   */
  private calculateLocationMultiplier(services: any[]): number {
    const locations = services
      .map(s => s.location)
      .filter(Boolean)
      .map(loc => loc.region?.toLowerCase())
      .filter(Boolean);

    if (locations.length === 0) return 1.0;

    // Calculate average location multiplier
    const multipliers = locations.map(region => {
      switch (region) {
        case 'auckland':
          return 1.2;
        case 'wellington':
          return 1.0;
        case 'christchurch':
          return 0.9;
        default:
          return 1.0;
      }
    });

    return (
      multipliers.reduce((sum, mult) => sum + mult, 0) / multipliers.length
    );
  }
}
