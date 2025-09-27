import { createClient } from '@/lib/supabase/server';
import { CompatibilityScore, ScoreBreakdown } from '@/types/matching';

export class CompatibilityService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Calculate compatibility score between event and contractor
   */
  async calculateCompatibility(
    eventId: string,
    contractorId: string
  ): Promise<{ compatibility: CompatibilityScore; breakdown: ScoreBreakdown }> {
    try {
      // Get event details
      const { data: event, error: eventError } = await this.supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        throw new Error('Event not found');
      }

      // Get contractor details
      const { data: contractor, error: contractorError } = await this.supabase
        .from('users')
        .select(
          `
          id,
          business_profiles!inner(*),
          services(*)
        `
        )
        .eq('id', contractorId)
        .eq('role', 'contractor')
        .single();

      if (contractorError || !contractor) {
        throw new Error('Contractor not found');
      }

      const businessProfile = contractor.business_profiles[0];
      const services = contractor.services || [];

      // Calculate individual scores
      const serviceTypeScore = this.calculateServiceTypeCompatibility(
        event,
        businessProfile
      );
      const experienceScore = this.calculateExperienceScore(businessProfile);
      const pricingScore = this.calculatePricingCompatibility(event, services);
      const locationScore = this.calculateLocationCompatibility(
        event,
        businessProfile
      );
      const performanceScore =
        await this.calculatePerformanceScore(contractorId);
      const availabilityScore = await this.calculateAvailabilityScore(
        contractorId,
        event.event_date
      );

      // Calculate overall score
      const overallScore =
        serviceTypeScore * 0.25 +
        experienceScore * 0.2 +
        pricingScore * 0.15 +
        locationScore * 0.15 +
        performanceScore * 0.15 +
        availabilityScore * 0.1;

      const compatibility: CompatibilityScore = {
        service_type_score: serviceTypeScore,
        experience_score: experienceScore,
        pricing_score: pricingScore,
        location_score: locationScore,
        performance_score: performanceScore,
        availability_score: availabilityScore,
        overall_score: Math.min(1, Math.max(0, overallScore)),
      };

      const breakdown: ScoreBreakdown = {
        service_type: serviceTypeScore,
        experience: experienceScore,
        pricing: pricingScore,
        location: locationScore,
        performance: performanceScore,
        availability: availabilityScore,
        total: compatibility.overall_score,
      };

      return { compatibility, breakdown };
    } catch (error) {
      throw new Error('Failed to calculate compatibility');
    }
  }

  private calculateServiceTypeCompatibility(
    event: any,
    businessProfile: any
  ): number {
    // Simplified service type matching
    const eventType = event.event_type?.toLowerCase() || '';
    const serviceCategories = businessProfile.service_categories || [];

    if (serviceCategories.length === 0) return 0.5;

    // Check for direct matches
    const directMatches = serviceCategories.filter(
      (category: string) =>
        category.toLowerCase().includes(eventType) ||
        eventType.includes(category.toLowerCase())
    );

    if (directMatches.length > 0) return 1.0;

    // Check for related matches
    const relatedMatches = serviceCategories.filter((category: string) => {
      const categoryLower = category.toLowerCase();
      return (
        categoryLower.includes('event') ||
        categoryLower.includes('party') ||
        categoryLower.includes('celebration') ||
        categoryLower.includes('wedding') ||
        categoryLower.includes('corporate')
      );
    });

    return relatedMatches.length > 0 ? 0.7 : 0.3;
  }

  private calculateExperienceScore(businessProfile: any): number {
    const baseScore = businessProfile.is_verified ? 0.8 : 0.5;
    const ratingBonus = (businessProfile.average_rating || 0) / 5;
    const reviewBonus = Math.min(0.2, (businessProfile.review_count || 0) / 50);

    return Math.min(1, baseScore + ratingBonus * 0.1 + reviewBonus);
  }

  private calculatePricingCompatibility(event: any, services: any[]): number {
    const eventBudget = event.budget_total || 0;
    if (eventBudget === 0) return 0.5;

    if (services.length === 0) return 0.5;

    const servicePrices = services
      .filter(s => s.price_range_min && s.price_range_max)
      .map(s => ({ min: s.price_range_min, max: s.price_range_max }));

    if (servicePrices.length === 0) return 0.5;

    const avgMinPrice =
      servicePrices.reduce((sum, p) => sum + p.min, 0) / servicePrices.length;
    const avgMaxPrice =
      servicePrices.reduce((sum, p) => sum + p.max, 0) / servicePrices.length;

    const budgetRatio = eventBudget / avgMaxPrice;
    return Math.min(1, budgetRatio);
  }

  private calculateLocationCompatibility(
    event: any,
    businessProfile: any
  ): number {
    const eventLocation = event.location_data;
    const serviceAreas = businessProfile.service_areas || [];

    if (!eventLocation || serviceAreas.length === 0) return 0.5;

    // Simplified location matching
    return 0.8; // Would implement actual geospatial calculations
  }

  private async calculatePerformanceScore(
    contractorId: string
  ): Promise<number> {
    try {
      const { data: performance, error } = await this.supabase
        .from('contractor_performance')
        .select('overall_performance_score')
        .eq('contractor_id', contractorId)
        .single();

      if (error || !performance) {
        return 0.5; // Default score if no performance data
      }

      return performance.overall_performance_score || 0.5;
    } catch (error) {
      return 0.5;
    }
  }

  private async calculateAvailabilityScore(
    contractorId: string,
    eventDate: string
  ): Promise<number> {
    try {
      const { data: availability, error } = await this.supabase
        .from('contractor_availability')
        .select('is_available')
        .eq('contractor_id', contractorId)
        .eq('event_date', eventDate)
        .eq('is_available', true)
        .single();

      if (error || !availability) {
        return 0.5; // Default score if no availability data
      }

      return availability.is_available ? 1.0 : 0.0;
    } catch (error) {
      return 0.5;
    }
  }
}

export const compatibilityService = new CompatibilityService();
