import { createClient } from '@/lib/supabase/server';
import { matchingCacheService } from './cache-service';
import { performanceMonitor } from './performance-monitor';
import {
  ContractorMatch,
  MatchingRequest,
  MatchingResponse,
  MatchingFilters,
  EventRequirements,
  ContractorProfile,
  CompatibilityScore,
  AvailabilityResult,
  BudgetCompatibility,
  LocationMatch,
  PerformanceScore,
  ContractorRanking,
  MatchingAnalytics,
} from '@/types/matching';

export class ContractorMatchingService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Find contractor matches for an event
   */
  async findMatches(request: MatchingRequest): Promise<MatchingResponse> {
    const {
      event_id,
      filters = {},
      page = 1,
      limit = 20,
      algorithm = 'default',
    } = request;
    const offset = (page - 1) * limit;
    const startTime = performance.now();

    try {
      // Check cache first
      const cachedMatches = await matchingCacheService.getCachedMatches(
        event_id,
        filters,
        algorithm
      );

      let matches: ContractorMatch[];
      let cacheHitRate = 0;

      if (cachedMatches) {
        matches = cachedMatches;
        cacheHitRate = 1;
        } else {
        // Get event details
        const event = await this.getEventDetails(event_id);
        if (!event) {
          throw new Error('Event not found');
        }

        // Get matching contractors
        const queryStartTime = performance.now();
        matches = await this.calculateMatches(event, filters, algorithm);
        const queryEndTime = performance.now();
        const queryTimeMs = queryEndTime - queryStartTime;

        // Cache the results
        await matchingCacheService.setCachedMatches(
          event_id,
          filters,
          algorithm,
          matches
        );

        // Log performance metrics
        const endTime = performance.now();
        const algorithmTimeMs = endTime - startTime;
        const memoryUsageMb = process.memoryUsage().heapUsed / 1024 / 1024;

        await performanceMonitor.logMatchingMetrics(
          event_id,
          algorithm,
          queryTimeMs,
          matches.length,
          cacheHitRate,
          algorithmTimeMs,
          memoryUsageMb
        );
      }

      // Apply pagination
      const paginatedMatches = matches.slice(offset, offset + limit);

      // Create analytics
      const analytics = await this.createMatchingAnalytics(
        event_id,
        algorithm,
        matches
      );

      return {
        matches: paginatedMatches,
        total: matches.length,
        page,
        limit,
        analytics,
      };
    } catch (error) {
      throw new Error('Failed to find contractor matches');
    }
  }

  /**
   * Calculate compatibility score between event and contractor
   */
  async calculateCompatibility(
    eventRequirements: EventRequirements,
    contractorProfile: ContractorProfile
  ): Promise<CompatibilityScore> {
    const serviceTypeScore = this.calculateServiceTypeCompatibility(
      eventRequirements.service_requirements,
      contractorProfile.service_categories
    );

    const experienceScore = this.calculateExperienceScore(contractorProfile);
    const pricingScore = this.calculatePricingCompatibility(
      eventRequirements.budget_total,
      contractorProfile.pricing_range
    );
    const locationScore = this.calculateLocationCompatibility(
      eventRequirements.location,
      contractorProfile.service_areas
    );
    const performanceScore = await this.calculatePerformanceScore(
      contractorProfile.contractor_id
    );
    const availabilityScore = await this.calculateAvailabilityScore(
      contractorProfile.contractor_id,
      eventRequirements.event_date,
      eventRequirements.duration_hours
    );

    const overallScore =
      serviceTypeScore * 0.25 +
      experienceScore * 0.2 +
      pricingScore * 0.15 +
      locationScore * 0.15 +
      performanceScore * 0.15 +
      availabilityScore * 0.1;

    return {
      service_type_score: serviceTypeScore,
      experience_score: experienceScore,
      pricing_score: pricingScore,
      location_score: locationScore,
      performance_score: performanceScore,
      availability_score: availabilityScore,
      overall_score: Math.min(1, Math.max(0, overallScore)),
    };
  }

  /**
   * Check contractor availability
   */
  async checkAvailability(
    contractorId: string,
    eventDate: string,
    duration: number
  ): Promise<AvailabilityResult> {
    try {
      const { data: availability, error } = await this.supabase
        .from('contractor_availability')
        .select('*')
        .eq('contractor_id', contractorId)
        .eq('event_date', eventDate)
        .eq('is_available', true);

      if (error) throw error;

      const isAvailable = availability && availability.length > 0;
      const conflicts: AvailabilityConflict[] = [];

      if (!isAvailable) {
        conflicts.push({
          id: 'unavailable',
          event_date: eventDate,
          start_time: '00:00',
          end_time: '23:59',
          conflict_type: 'unavailable',
          description: 'Contractor is not available on this date',
        });
      }

      return {
        contractor_id: contractorId,
        available: isAvailable,
        conflicts,
        availability_score: isAvailable ? 1 : 0,
      };
    } catch (error) {
      return {
        contractor_id: contractorId,
        available: false,
        conflicts: [
          {
            id: 'error',
            event_date: eventDate,
            start_time: '00:00',
            end_time: '23:59',
            conflict_type: 'unavailable',
            description: 'Error checking availability',
          },
        ],
        availability_score: 0,
      };
    }
  }

  /**
   * Calculate budget compatibility
   */
  async calculateBudgetCompatibility(
    eventBudget: number,
    contractorPricing: { min: number; max: number }
  ): Promise<BudgetCompatibility> {
    const budgetRangeMatch =
      eventBudget >= contractorPricing.min &&
      eventBudget <= contractorPricing.max;
    const priceAffordability = Math.min(1, eventBudget / contractorPricing.max);
    const valueScore = contractorPricing.min / eventBudget;
    const budgetFlexibility = Math.min(
      1,
      (contractorPricing.max - contractorPricing.min) / eventBudget
    );

    const overallScore =
      (budgetRangeMatch ? 1 : 0) * 0.4 +
      priceAffordability * 0.3 +
      valueScore * 0.2 +
      budgetFlexibility * 0.1;

    return {
      budget_range_match: budgetRangeMatch,
      price_affordability: priceAffordability,
      value_score: valueScore,
      budget_flexibility: budgetFlexibility,
      overall_score: Math.min(1, Math.max(0, overallScore)),
    };
  }

  /**
   * Calculate location match
   */
  async calculateLocationMatch(
    eventLocation: { lat: number; lng: number },
    contractorServiceAreas: string[]
  ): Promise<LocationMatch> {
    // Simplified location matching - in real implementation, would use geospatial calculations
    const serviceAreaCoverage = contractorServiceAreas.length > 0 ? 1 : 0;
    const distanceKm = 0; // Would calculate actual distance
    const proximityScore =
      distanceKm < 50 ? 1 : Math.max(0, 1 - distanceKm / 100);
    const accessibilityScore = 0.8; // Would calculate based on transport links

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
  }

  /**
   * Calculate performance score
   */
  async calculatePerformanceScore(
    contractorId: string
  ): Promise<PerformanceScore> {
    try {
      const { data: performance, error } = await this.supabase
        .from('contractor_performance')
        .select('*')
        .eq('contractor_id', contractorId)
        .single();

      if (error || !performance) {
        return {
          contractor_id: contractorId,
          response_time_hours: 24,
          reliability_score: 0.5,
          quality_score: 0.5,
          communication_score: 0.5,
          overall_performance_score: 0.5,
          total_projects: 0,
          successful_projects: 0,
          success_rate: 0,
        };
      }

      const successRate =
        performance.total_projects > 0
          ? performance.successful_projects / performance.total_projects
          : 0;

      return {
        contractor_id: contractorId,
        response_time_hours: performance.response_time_hours || 24,
        reliability_score: performance.reliability_score || 0.5,
        quality_score: performance.quality_score || 0.5,
        communication_score: performance.communication_score || 0.5,
        overall_performance_score: performance.overall_performance_score || 0.5,
        total_projects: performance.total_projects,
        successful_projects: performance.successful_projects,
        success_rate: successRate,
      };
    } catch (error) {
      return {
        contractor_id: contractorId,
        response_time_hours: 24,
        reliability_score: 0.5,
        quality_score: 0.5,
        communication_score: 0.5,
        overall_performance_score: 0.5,
        total_projects: 0,
        successful_projects: 0,
        success_rate: 0,
      };
    }
  }

  /**
   * Rank contractors based on matches
   */
  async rankContractors(
    matches: ContractorMatch[],
    algorithm: string = 'default'
  ): Promise<ContractorRanking[]> {
    const rankings: ContractorRanking[] = matches
      .sort((a, b) => b.overall_score - a.overall_score)
      .map((match, index) => ({
        contractor_id: match.contractor_id,
        rank: index + 1,
        score: match.overall_score,
        is_premium: match.is_premium,
        match_reasons: this.generateMatchReasons(match),
      }));

    return rankings;
  }

  // Private helper methods

  private async getEventDetails(eventId: string) {
    const { data: event, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw error;
    return event;
  }

  private async calculateMatches(
    event: any,
    filters: MatchingFilters,
    algorithm: string
  ): Promise<ContractorMatch[]> {
    const startTime = performance.now();

    // Batch query: Get all contractors with their profiles, performance, and availability in one query
    const { data: contractors, error } = await this.supabase
      .from('users')
      .select(
        `
        id,
        business_profiles!inner(*),
        services(*),
        contractor_performance(*),
        contractor_availability!left(*)
      `
      )
      .eq('role', 'contractor')
      .eq('is_verified', true);

    if (error) throw error;

    const matches: ContractorMatch[] = [];
    const eventRequirements = this.eventToRequirements(event);

    // Process contractors in batches for better performance
    const batchSize = 50;
    const batches = this.chunkArray(contractors, batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(async contractor => {
        const businessProfile = contractor.business_profiles[0];
        const services = contractor.services || [];
        const performance = contractor.contractor_performance?.[0];
        const availability = contractor.contractor_availability?.find(
          a => a.event_date === event.event_date && a.is_available
        );

        // Early termination for very low potential scores
        const quickScore = this.calculateQuickScore(
          businessProfile,
          services,
          performance
        );
        if (quickScore < 0.3) {
          return null; // Skip detailed calculations
        }

        // Calculate compatibility scores (optimized)
        const compatibility = this.calculateCompatibilityOptimized(
          eventRequirements,
          this.contractorToProfile(contractor, businessProfile, services)
        );

        const availabilityScore = availability ? 1 : 0;
        const budget = this.calculateBudgetCompatibilityOptimized(
          event.budget_total || 0,
          this.getContractorPricing(services)
        );

        const location = this.calculateLocationMatchOptimized(
          event.location_data || { lat: 0, lng: 0 },
          businessProfile.service_areas || []
        );

        const performanceScore =
          this.calculatePerformanceScoreOptimized(performance);

        const overallScore =
          compatibility.overall_score * 0.3 +
          availabilityScore * 0.2 +
          budget.overall_score * 0.2 +
          location.overall_score * 0.15 +
          performanceScore * 0.15;

        return {
          id: crypto.randomUUID(),
          event_id: event.id,
          contractor_id: contractor.id,
          compatibility_score: compatibility.overall_score,
          availability_score: availabilityScore,
          budget_score: budget.overall_score,
          location_score: location.overall_score,
          performance_score: performanceScore,
          overall_score: overallScore,
          is_premium: businessProfile.subscription_tier !== 'essential',
          match_algorithm: algorithm,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      const batchResults = await Promise.all(batchPromises);
      matches.push(...batchResults.filter(Boolean));
    }

    const endTime = performance.now();
    return matches.sort((a, b) => b.overall_score - a.overall_score);
  }

  private eventToRequirements(event: any): EventRequirements {
    return {
      event_id: event.id,
      event_type: event.event_type || 'general',
      event_date: event.event_date,
      duration_hours: event.duration_hours || 8,
      location: event.location_data || {
        lat: 0,
        lng: 0,
        address: event.location || '',
      },
      budget_total: event.budget_total || 0,
      service_requirements: [], // Would be populated from event_service_requirements table
      special_requirements: event.special_requirements,
    };
  }

  private contractorToProfile(
    contractor: any,
    businessProfile: any,
    services: any[]
  ): ContractorProfile {
    return {
      contractor_id: contractor.id,
      company_name: businessProfile.company_name,
      service_categories: businessProfile.service_categories || [],
      service_areas: businessProfile.service_areas || [],
      pricing_range: this.getContractorPricing(services),
      availability: 'flexible', // Would be calculated from availability data
      is_verified: businessProfile.is_verified,
      subscription_tier: businessProfile.subscription_tier,
      average_rating: businessProfile.average_rating || 0,
      review_count: businessProfile.review_count || 0,
    };
  }

  private getContractorPricing(services: any[]): { min: number; max: number } {
    if (services.length === 0) return { min: 0, max: 1000 };

    const prices = services
      .filter(s => s.price_range_min && s.price_range_max)
      .map(s => ({ min: s.price_range_min, max: s.price_range_max }));

    if (prices.length === 0) return { min: 0, max: 1000 };

    return {
      min: Math.min(...prices.map(p => p.min)),
      max: Math.max(...prices.map(p => p.max)),
    };
  }

  private calculateServiceTypeCompatibility(
    eventRequirements: any[],
    contractorCategories: string[]
  ): number {
    if (eventRequirements.length === 0 || contractorCategories.length === 0)
      return 0.5;

    const matchingCategories = eventRequirements.filter(req =>
      contractorCategories.includes(req.category)
    ).length;

    return matchingCategories / eventRequirements.length;
  }

  private calculateExperienceScore(
    contractorProfile: ContractorProfile
  ): number {
    const baseScore = contractorProfile.is_verified ? 0.8 : 0.5;
    const ratingBonus = contractorProfile.average_rating / 5;
    const reviewBonus = Math.min(0.2, contractorProfile.review_count / 50);

    return Math.min(1, baseScore + ratingBonus * 0.1 + reviewBonus);
  }

  private calculatePricingCompatibility(
    eventBudget: number,
    contractorPricing: { min: number; max: number }
  ): number {
    if (eventBudget === 0) return 0.5;

    const budgetRatio = eventBudget / contractorPricing.max;
    return Math.min(1, budgetRatio);
  }

  private calculateLocationCompatibility(
    eventLocation: any,
    serviceAreas: string[]
  ): number {
    if (serviceAreas.length === 0) return 0.5;
    return 0.8; // Simplified - would calculate actual location compatibility
  }

  private async calculateAvailabilityScore(
    contractorId: string,
    eventDate: string,
    duration: number
  ): Promise<number> {
    const availability = await this.checkAvailability(
      contractorId,
      eventDate,
      duration
    );
    return availability.availability_score;
  }

  private generateMatchReasons(match: ContractorMatch): string[] {
    const reasons: string[] = [];

    if (match.compatibility_score > 0.8)
      reasons.push('High service compatibility');
    if (match.availability_score > 0.8)
      reasons.push('Available for your event date');
    if (match.budget_score > 0.8) reasons.push('Fits within your budget');
    if (match.location_score > 0.8)
      reasons.push('Located in your service area');
    if (match.performance_score > 0.8)
      reasons.push('Excellent performance record');
    if (match.is_premium) reasons.push('Premium contractor');

    return reasons;
  }

  // Performance optimization helper methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private calculateQuickScore(
    businessProfile: any,
    services: any[],
    performance: any
  ): number {
    // Quick scoring for early termination
    const baseScore = businessProfile.is_verified ? 0.6 : 0.3;
    const serviceScore = services.length > 0 ? 0.2 : 0;
    const performanceScore = performance?.overall_performance_score
      ? performance.overall_performance_score * 0.2
      : 0.1;

    return Math.min(1, baseScore + serviceScore + performanceScore);
  }

  private calculateCompatibilityOptimized(
    eventRequirements: EventRequirements,
    contractorProfile: ContractorProfile
  ): CompatibilityScore {
    // Optimized compatibility calculation without async calls
    const serviceTypeScore = this.calculateServiceTypeCompatibility(
      eventRequirements.service_requirements,
      contractorProfile.service_categories
    );

    const experienceScore = this.calculateExperienceScore(contractorProfile);
    const pricingScore = this.calculatePricingCompatibility(
      eventRequirements.budget_total,
      contractorProfile.pricing_range
    );
    const locationScore = this.calculateLocationCompatibility(
      eventRequirements.location,
      contractorProfile.service_areas
    );

    // Use cached performance data instead of async call
    const performanceScore = contractorProfile.average_rating / 5;
    const availabilityScore = 0.8; // Default optimistic score

    const overallScore =
      serviceTypeScore * 0.25 +
      experienceScore * 0.2 +
      pricingScore * 0.15 +
      locationScore * 0.15 +
      performanceScore * 0.15 +
      availabilityScore * 0.1;

    return {
      service_type_score: serviceTypeScore,
      experience_score: experienceScore,
      pricing_score: pricingScore,
      location_score: locationScore,
      performance_score: performanceScore,
      availability_score: availabilityScore,
      overall_score: Math.min(1, Math.max(0, overallScore)),
    };
  }

  private calculateBudgetCompatibilityOptimized(
    eventBudget: number,
    contractorPricing: { min: number; max: number }
  ): BudgetCompatibility {
    const budgetRangeMatch =
      eventBudget >= contractorPricing.min &&
      eventBudget <= contractorPricing.max;
    const priceAffordability = Math.min(1, eventBudget / contractorPricing.max);
    const valueScore = contractorPricing.min / eventBudget;
    const budgetFlexibility = Math.min(
      1,
      (contractorPricing.max - contractorPricing.min) / eventBudget
    );

    const overallScore =
      (budgetRangeMatch ? 1 : 0) * 0.4 +
      priceAffordability * 0.3 +
      valueScore * 0.2 +
      budgetFlexibility * 0.1;

    return {
      budget_range_match: budgetRangeMatch,
      price_affordability: priceAffordability,
      value_score: valueScore,
      budget_flexibility: budgetFlexibility,
      overall_score: Math.min(1, Math.max(0, overallScore)),
    };
  }

  private calculateLocationMatchOptimized(
    eventLocation: { lat: number; lng: number },
    contractorServiceAreas: string[]
  ): LocationMatch {
    // Optimized location matching without async calls
    const serviceAreaCoverage = contractorServiceAreas.length > 0 ? 1 : 0;
    const distanceKm = 0; // Would calculate actual distance
    const proximityScore =
      distanceKm < 50 ? 1 : Math.max(0, 1 - distanceKm / 100);
    const accessibilityScore = 0.8; // Would calculate based on transport links

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
  }

  private calculatePerformanceScoreOptimized(performance: any): number {
    if (!performance) return 0.5;
    return performance.overall_performance_score || 0.5;
  }

  private async createMatchingAnalytics(
    eventId: string,
    algorithm: string,
    matches: ContractorMatch[]
  ): Promise<MatchingAnalytics> {
    const analytics: MatchingAnalytics = {
      id: crypto.randomUUID(),
      event_id: eventId,
      matching_algorithm: algorithm,
      total_contractors: matches.length,
      matching_contractors: matches.length,
      premium_contractors: matches.filter(m => m.is_premium).length,
      average_score:
        matches.reduce((sum, m) => sum + m.overall_score, 0) / matches.length,
      created_at: new Date().toISOString(),
    };

    // Store analytics in database
    await this.supabase.from('matching_analytics').insert(analytics);

    return analytics;
  }

  /**
   * Invalidate cache for a specific event
   */
  async invalidateEventCache(eventId: string): Promise<void> {
    await matchingCacheService.invalidateEventCache(eventId);
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(timeRangeHours: number = 24) {
    return performanceMonitor.getPerformanceStats(timeRangeHours);
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(timeRangeHours: number = 24) {
    return performanceMonitor.getPerformanceTrends(timeRangeHours);
  }
}

// Export singleton instance
export const matchingService = new ContractorMatchingService();
