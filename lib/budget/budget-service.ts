import { createClient } from '@/lib/supabase/server';
import { PricingService, LocationData } from './pricing-service';

export interface BudgetRecommendation {
  id: string;
  event_type: string;
  service_category: string;
  recommended_amount: number;
  confidence_score: number;
  pricing_source: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceBudgetBreakdown {
  id: string;
  event_id: string;
  service_category: string;
  estimated_cost: number;
  adjustment_reason?: string;
  package_applied: boolean;
  package_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCalculation {
  recommendations: BudgetRecommendation[];
  total_budget: number;
  breakdown: ServiceBudgetBreakdown[];
  adjustments: {
    attendee_multiplier: number;
    location_multiplier: number;
    seasonal_multiplier: number;
  };
  metadata: {
    event_type: string;
    location?: LocationData;
    attendee_count?: number;
    duration?: number;
    calculation_timestamp: string;
  };
}

export class BudgetService {
  private supabase = createClient();
  private pricingService = new PricingService();
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

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
   * Calculate overall budget recommendations for an event
   */
  async calculateBudgetRecommendations(
    eventType: string,
    location?: LocationData,
    attendeeCount?: number,
    duration?: number
  ): Promise<BudgetCalculation> {
    try {
      // Create cache key
      const cacheKey = `budget:${eventType}:${JSON.stringify(location)}:${attendeeCount}:${duration}`;

      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        console.log('Budget calculation cache hit');
        return cached.data;
      }

      // Get base recommendations from database
      const { data: baseRecommendations, error: recError } = await this.supabase
        .from('budget_recommendations')
        .select('*')
        .eq('event_type', eventType)
        .order('confidence_score', { ascending: false });

      if (recError) {
        throw new Error(`Failed to fetch recommendations: ${recError.message}`);
      }

      if (!baseRecommendations || baseRecommendations.length === 0) {
        throw new Error(
          `No recommendations found for event type: ${eventType}`
        );
      }

      // Calculate multipliers
      const attendeeMultiplier = attendeeCount
        ? this.pricingService.calculateAttendeeMultiplier(attendeeCount)
        : 1.0;

      let locationMultiplier = 1.0;
      if (location) {
        const pricingData = await this.pricingService.getPricingData(
          'general',
          location
        );
        if (pricingData) {
          locationMultiplier = pricingData.location_multiplier;
        }
      }

      // Apply adjustments to recommendations
      const adjustedRecommendations = baseRecommendations.map(rec => {
        let adjustedAmount = rec.recommended_amount;

        // Apply attendee scaling (except for venue which is fixed)
        if (attendeeCount && rec.service_category !== 'venue') {
          adjustedAmount *= attendeeMultiplier;
        }

        // Apply location multiplier
        adjustedAmount *= locationMultiplier;

        // Apply duration multiplier for hourly services
        if (duration && this.isHourlyService(rec.service_category)) {
          adjustedAmount *= duration / 8; // Base on 8-hour day
        }

        return {
          ...rec,
          recommended_amount: Math.round(adjustedAmount * 100) / 100,
          confidence_score: Math.min(1.0, rec.confidence_score * 0.9), // Slight reduction for adjustments
        };
      });

      // Calculate total budget
      const totalBudget = adjustedRecommendations.reduce(
        (sum, rec) => sum + rec.recommended_amount,
        0
      );

      // Create service breakdown
      const breakdown = adjustedRecommendations.map(rec => ({
        id: rec.id,
        event_id: '', // Will be set when event is created
        service_category: rec.service_category,
        estimated_cost: rec.recommended_amount,
        package_applied: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const result = {
        recommendations: adjustedRecommendations,
        total_budget: Math.round(totalBudget * 100) / 100,
        breakdown,
        adjustments: {
          attendee_multiplier: attendeeMultiplier,
          location_multiplier: locationMultiplier,
          seasonal_multiplier: 1.0, // Will be calculated based on event date
        },
        metadata: {
          event_type: eventType,
          location,
          attendee_count: attendeeCount,
          duration,
          calculation_timestamp: new Date().toISOString(),
        },
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Budget calculation error:', error);
      throw error;
    }
  }

  /**
   * Get service-specific budget breakdown for an event
   */
  async getServiceBreakdown(
    eventId: string,
    serviceCategories?: string[]
  ): Promise<{
    breakdown: ServiceBudgetBreakdown[];
    total: number;
  }> {
    try {
      const { data: breakdown, error } = await this.supabase
        .from('service_budget_breakdown')
        .select('*')
        .eq('event_id', eventId);

      if (error) {
        throw new Error(`Failed to fetch service breakdown: ${error.message}`);
      }

      // Filter by service categories if provided
      let filteredBreakdown = breakdown || [];
      if (serviceCategories && serviceCategories.length > 0) {
        filteredBreakdown = filteredBreakdown.filter(item =>
          serviceCategories.includes(item.service_category)
        );
      }

      // Calculate total
      const total = filteredBreakdown.reduce(
        (sum, item) => sum + (item.estimated_cost || 0),
        0
      );

      return {
        breakdown: filteredBreakdown,
        total: Math.round(total * 100) / 100,
      };
    } catch (error) {
      console.error('Service breakdown error:', error);
      throw error;
    }
  }

  /**
   * Apply budget adjustments to service breakdown
   */
  async applyBudgetAdjustments(
    eventId: string,
    adjustments: Array<{
      service_category: string;
      adjustment_type: 'percentage' | 'fixed';
      adjustment_value: number;
      reason?: string;
    }>
  ): Promise<ServiceBudgetBreakdown[]> {
    try {
      const updatedBreakdown = [];

      for (const adjustment of adjustments) {
        // Get existing breakdown item
        const { data: existingItem, error: fetchError } = await this.supabase
          .from('service_budget_breakdown')
          .select('*')
          .eq('event_id', eventId)
          .eq('service_category', adjustment.service_category)
          .single();

        let newCost = existingItem?.estimated_cost || 0;

        // Apply adjustment
        if (adjustment.adjustment_type === 'percentage') {
          newCost *= 1 + adjustment.adjustment_value / 100;
        } else {
          newCost += adjustment.adjustment_value;
        }

        // Ensure cost doesn't go below zero
        newCost = Math.max(0, newCost);

        // Update or create breakdown item
        const { data: updatedItem, error: updateError } = await this.supabase
          .from('service_budget_breakdown')
          .upsert({
            event_id: eventId,
            service_category: adjustment.service_category,
            estimated_cost: newCost,
            adjustment_reason: adjustment.reason,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (updateError) {
          console.error('Error updating breakdown item:', updateError);
          continue;
        }

        updatedBreakdown.push(updatedItem);
      }

      return updatedBreakdown;
    } catch (error) {
      console.error('Budget adjustment error:', error);
      throw error;
    }
  }

  /**
   * Track actual vs estimated costs
   */
  async trackBudgetVariance(
    eventId: string,
    actualCosts: Record<string, number>
  ): Promise<void> {
    try {
      // Get current budget tracking
      const { data: existingTracking, error: fetchError } = await this.supabase
        .from('budget_tracking')
        .select('*')
        .eq('event_id', eventId);

      if (fetchError) {
        console.error('Error fetching budget tracking:', fetchError);
        return;
      }

      // Update or create tracking records
      for (const [serviceCategory, actualCost] of Object.entries(actualCosts)) {
        const existingRecord = existingTracking?.find(
          record => record.service_category === serviceCategory
        );

        const estimatedCost = existingRecord?.estimated_cost || 0;
        const variance = actualCost - estimatedCost;

        if (existingRecord) {
          // Update existing record
          await this.supabase
            .from('budget_tracking')
            .update({
              actual_cost: actualCost,
              variance: variance,
              tracking_date: new Date().toISOString(),
            })
            .eq('id', existingRecord.id);
        } else {
          // Create new record
          await this.supabase.from('budget_tracking').insert({
            event_id: eventId,
            service_category: serviceCategory,
            estimated_cost: estimatedCost,
            actual_cost: actualCost,
            variance: variance,
            tracking_date: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Budget tracking error:', error);
      throw error;
    }
  }

  /**
   * Get budget insights and analytics
   */
  async getBudgetInsights(eventId: string): Promise<{
    total_estimated: number;
    total_actual: number;
    total_variance: number;
    variance_percentage: number;
    top_overruns: Array<{
      service_category: string;
      variance: number;
      variance_percentage: number;
    }>;
    top_savings: Array<{
      service_category: string;
      variance: number;
      variance_percentage: number;
    }>;
  }> {
    try {
      const { data: tracking, error } = await this.supabase
        .from('budget_tracking')
        .select('*')
        .eq('event_id', eventId);

      if (error || !tracking) {
        throw new Error(`Failed to fetch budget tracking: ${error?.message}`);
      }

      const totalEstimated = tracking.reduce(
        (sum, record) => sum + (record.estimated_cost || 0),
        0
      );
      const totalActual = tracking.reduce(
        (sum, record) => sum + (record.actual_cost || 0),
        0
      );
      const totalVariance = totalActual - totalEstimated;
      const variancePercentage =
        totalEstimated > 0 ? (totalVariance / totalEstimated) * 100 : 0;

      // Calculate top overruns and savings
      const overruns = tracking
        .filter(record => record.variance > 0)
        .sort((a, b) => b.variance - a.variance)
        .slice(0, 3)
        .map(record => ({
          service_category: record.service_category,
          variance: record.variance,
          variance_percentage:
            record.estimated_cost > 0
              ? (record.variance / record.estimated_cost) * 100
              : 0,
        }));

      const savings = tracking
        .filter(record => record.variance < 0)
        .sort((a, b) => a.variance - b.variance)
        .slice(0, 3)
        .map(record => ({
          service_category: record.service_category,
          variance: record.variance,
          variance_percentage:
            record.estimated_cost > 0
              ? (record.variance / record.estimated_cost) * 100
              : 0,
        }));

      return {
        total_estimated: totalEstimated,
        total_actual: totalActual,
        total_variance: totalVariance,
        variance_percentage: variancePercentage,
        top_overruns: overruns,
        top_savings: savings,
      };
    } catch (error) {
      console.error('Budget insights error:', error);
      throw error;
    }
  }

  /**
   * Check if a service is hourly-based
   */
  private isHourlyService(serviceCategory: string): boolean {
    const hourlyServices = [
      'photography',
      'music',
      'entertainment',
      'security',
      'staffing',
    ];
    return hourlyServices.includes(serviceCategory);
  }
}
