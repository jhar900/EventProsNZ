import { ServiceRecommendation } from '@/types/contractors';

export interface UserPreference {
  id: string;
  userId: string;
  preferenceType:
    | 'service_category'
    | 'price_range'
    | 'location'
    | 'event_type'
    | 'contractor_rating'
    | 'availability'
    | 'personalization_level';
  preferenceData: any;
  weight: number; // 0-1, how important this preference is
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed: Date;
  usageCount: number;
}

export interface UserPreferenceProfile {
  userId: string;
  preferences: UserPreference[];
  behaviorPatterns: {
    preferredEventTypes: string[];
    preferredServiceCategories: string[];
    averageBudget: number;
    preferredLocations: string[];
    timePreferences: {
      preferredDays: string[];
      preferredTimes: string[];
      advanceBookingDays: number;
    };
    qualityPreferences: {
      minRating: number;
      preferVerified: boolean;
      preferPremium: boolean;
    };
    communicationPreferences: {
      preferredContactMethod: 'email' | 'phone' | 'sms';
      responseTimeExpectation: string;
      notificationFrequency: 'immediate' | 'daily' | 'weekly';
    };
  };
  learningInsights: {
    mostUsedServices: Array<{ service: string; count: number }>;
    seasonalPatterns: Record<string, number>;
    budgetPatterns: Array<{ eventType: string; averageBudget: number }>;
    locationPatterns: Array<{ location: string; frequency: number }>;
  };
  lastUpdated: Date;
}

export interface PreferenceRecommendation {
  serviceId: string;
  serviceName: string;
  matchScore: number;
  reasoning: string[];
  preferenceFactors: Array<{
    preference: string;
    match: boolean;
    weight: number;
    impact: number;
  }>;
}

export class UserPreferencesEngine {
  private static instance: UserPreferencesEngine;
  private preferences: Map<string, UserPreference[]> = new Map();
  private profiles: Map<string, UserPreferenceProfile> = new Map();

  static getInstance(): UserPreferencesEngine {
    if (!UserPreferencesEngine.instance) {
      UserPreferencesEngine.instance = new UserPreferencesEngine();
    }
    return UserPreferencesEngine.instance;
  }

  /**
   * Add or update a user preference
   */
  async setPreference(
    userId: string,
    preferenceType: UserPreference['preferenceType'],
    preferenceData: any,
    weight: number = 0.5
  ): Promise<UserPreference> {
    const existingPreference = this.getPreference(userId, preferenceType);

    if (existingPreference) {
      // Update existing preference
      existingPreference.preferenceData = preferenceData;
      existingPreference.weight = weight;
      existingPreference.updatedAt = new Date();
      existingPreference.lastUsed = new Date();
      existingPreference.usageCount++;

      await this.updateUserProfile(userId);
      return existingPreference;
    } else {
      // Create new preference
      const preference: UserPreference = {
        id: this.generateId(),
        userId,
        preferenceType,
        preferenceData,
        weight,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsed: new Date(),
        usageCount: 1,
      };

      if (!this.preferences.has(userId)) {
        this.preferences.set(userId, []);
      }
      this.preferences.get(userId)!.push(preference);

      await this.updateUserProfile(userId);
      return preference;
    }
  }

  /**
   * Get a specific preference for a user
   */
  getPreference(
    userId: string,
    preferenceType: UserPreference['preferenceType']
  ): UserPreference | null {
    const userPreferences = this.preferences.get(userId) || [];
    return (
      userPreferences.find(
        p => p.preferenceType === preferenceType && p.isActive
      ) || null
    );
  }

  /**
   * Get all preferences for a user
   */
  getUserPreferences(userId: string): UserPreference[] {
    return this.preferences.get(userId) || [];
  }

  /**
   * Get user preference profile
   */
  getUserProfile(userId: string): UserPreferenceProfile | null {
    return this.profiles.get(userId) || null;
  }

  /**
   * Remove a preference
   */
  async removePreference(
    userId: string,
    preferenceType: UserPreference['preferenceType']
  ): Promise<boolean> {
    const userPreferences = this.preferences.get(userId) || [];
    const preferenceIndex = userPreferences.findIndex(
      p => p.preferenceType === preferenceType
    );

    if (preferenceIndex === -1) return false;

    userPreferences[preferenceIndex].isActive = false;
    this.preferences.set(userId, userPreferences);

    await this.updateUserProfile(userId);
    return true;
  }

  /**
   * Learn from user behavior
   */
  async learnFromBehavior(
    userId: string,
    behavior: {
      eventType?: string;
      serviceCategory?: string;
      budget?: number;
      location?: string;
      contractorRating?: number;
      selectedServices?: string[];
      feedback?: {
        serviceId: string;
        rating: number;
        feedback: string;
      }[];
    }
  ): Promise<void> {
    // Update preferences based on behavior
    if (behavior.eventType) {
      await this.updateEventTypePreference(userId, behavior.eventType);
    }

    if (behavior.serviceCategory) {
      await this.updateServiceCategoryPreference(
        userId,
        behavior.serviceCategory
      );
    }

    if (behavior.budget) {
      await this.updateBudgetPreference(userId, behavior.budget);
    }

    if (behavior.location) {
      await this.updateLocationPreference(userId, behavior.location);
    }

    if (behavior.contractorRating) {
      await this.updateRatingPreference(userId, behavior.contractorRating);
    }

    if (behavior.selectedServices) {
      await this.updateServiceSelectionPreference(
        userId,
        behavior.selectedServices
      );
    }

    if (behavior.feedback) {
      await this.updateFeedbackPreference(userId, behavior.feedback);
    }

    await this.updateUserProfile(userId);
  }

  /**
   * Generate personalized recommendations based on preferences
   */
  async generatePersonalizedRecommendations(
    userId: string,
    services: ServiceRecommendation[],
    context?: {
      eventType?: string;
      location?: string;
      budget?: number;
      guestCount?: number;
    }
  ): Promise<PreferenceRecommendation[]> {
    const userProfile = this.getUserProfile(userId);
    if (!userProfile) {
      // Return services with default scoring if no profile exists
      return services.map(service => ({
        serviceId: service.id,
        serviceName: service.service_name,
        matchScore: service.confidence_score * 100,
        reasoning: ['No user preferences available'],
        preferenceFactors: [],
      }));
    }

    const recommendations: PreferenceRecommendation[] = [];

    for (const service of services) {
      const matchScore = await this.calculatePreferenceMatchScore(
        service,
        userProfile,
        context
      );
      const reasoning = this.generatePreferenceReasoning(
        service,
        userProfile,
        context
      );
      const preferenceFactors = this.calculatePreferenceFactors(
        service,
        userProfile,
        context
      );

      recommendations.push({
        serviceId: service.id,
        serviceName: service.service_name,
        matchScore,
        reasoning,
        preferenceFactors,
      });
    }

    // Sort by match score (highest first)
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate preference match score for a service
   */
  private async calculatePreferenceMatchScore(
    service: ServiceRecommendation,
    profile: UserPreferenceProfile,
    context?: any
  ): Promise<number> {
    let score = 0;
    let totalWeight = 0;

    // Event type preference
    if (
      context?.eventType &&
      profile.behaviorPatterns.preferredEventTypes.includes(context.eventType)
    ) {
      score += 20;
      totalWeight += 20;
    }

    // Service category preference
    if (
      profile.behaviorPatterns.preferredServiceCategories.includes(
        service.service_category
      )
    ) {
      score += 25;
      totalWeight += 25;
    }

    // Location preference
    if (
      context?.location &&
      profile.behaviorPatterns.preferredLocations.includes(context.location)
    ) {
      score += 15;
      totalWeight += 15;
    }

    // Budget preference
    if (context?.budget && service.estimated_cost) {
      const budgetRatio = context.budget / service.estimated_cost;
      if (budgetRatio >= 0.8 && budgetRatio <= 1.2) {
        score += 20;
        totalWeight += 20;
      } else if (budgetRatio >= 0.6 && budgetRatio <= 1.4) {
        score += 10;
        totalWeight += 20;
      }
    }

    // Quality preference
    if (profile.behaviorPatterns.qualityPreferences.minRating > 0) {
      // This would require contractor rating data
      score += 10;
      totalWeight += 10;
    }

    // Most used services
    const mostUsedService = profile.learningInsights.mostUsedServices.find(s =>
      s.service.toLowerCase().includes(service.service_name.toLowerCase())
    );
    if (mostUsedService) {
      score += 10;
      totalWeight += 10;
    }

    return totalWeight > 0
      ? (score / totalWeight) * 100
      : service.confidence_score * 100;
  }

  /**
   * Generate reasoning for preference match
   */
  private generatePreferenceReasoning(
    service: ServiceRecommendation,
    profile: UserPreferenceProfile,
    context?: any
  ): string[] {
    const reasoning: string[] = [];

    // Event type match
    if (
      context?.eventType &&
      profile.behaviorPatterns.preferredEventTypes.includes(context.eventType)
    ) {
      reasoning.push(`Matches your preferred event type: ${context.eventType}`);
    }

    // Service category match
    if (
      profile.behaviorPatterns.preferredServiceCategories.includes(
        service.service_category
      )
    ) {
      reasoning.push(
        `Matches your preferred service category: ${service.service_category}`
      );
    }

    // Location match
    if (
      context?.location &&
      profile.behaviorPatterns.preferredLocations.includes(context.location)
    ) {
      reasoning.push(`Matches your preferred location: ${context.location}`);
    }

    // Budget match
    if (context?.budget && service.estimated_cost) {
      const budgetRatio = context.budget / service.estimated_cost;
      if (budgetRatio >= 0.8 && budgetRatio <= 1.2) {
        reasoning.push('Fits well within your typical budget range');
      }
    }

    // Most used services
    const mostUsedService = profile.learningInsights.mostUsedServices.find(s =>
      s.service.toLowerCase().includes(service.service_name.toLowerCase())
    );
    if (mostUsedService) {
      reasoning.push(
        `Similar to services you've used before (${mostUsedService.count} times)`
      );
    }

    // Seasonal patterns
    const currentMonth = new Date().getMonth();
    const season = this.getSeason(currentMonth);
    if (profile.learningInsights.seasonalPatterns[season] > 0.7) {
      reasoning.push(`Popular during ${season} season based on your history`);
    }

    return reasoning.length > 0
      ? reasoning
      : ['Based on general recommendations'];
  }

  /**
   * Calculate preference factors
   */
  private calculatePreferenceFactors(
    service: ServiceRecommendation,
    profile: UserPreferenceProfile,
    context?: any
  ): Array<{
    preference: string;
    match: boolean;
    weight: number;
    impact: number;
  }> {
    const factors: Array<{
      preference: string;
      match: boolean;
      weight: number;
      impact: number;
    }> = [];

    // Event type factor
    factors.push({
      preference: 'Event Type',
      match: context?.eventType
        ? profile.behaviorPatterns.preferredEventTypes.includes(
            context.eventType
          )
        : false,
      weight: 0.2,
      impact:
        context?.eventType &&
        profile.behaviorPatterns.preferredEventTypes.includes(context.eventType)
          ? 20
          : 0,
    });

    // Service category factor
    factors.push({
      preference: 'Service Category',
      match: profile.behaviorPatterns.preferredServiceCategories.includes(
        service.service_category
      ),
      weight: 0.25,
      impact: profile.behaviorPatterns.preferredServiceCategories.includes(
        service.service_category
      )
        ? 25
        : 0,
    });

    // Location factor
    factors.push({
      preference: 'Location',
      match: context?.location
        ? profile.behaviorPatterns.preferredLocations.includes(context.location)
        : false,
      weight: 0.15,
      impact:
        context?.location &&
        profile.behaviorPatterns.preferredLocations.includes(context.location)
          ? 15
          : 0,
    });

    // Budget factor
    const budgetMatch =
      context?.budget && service.estimated_cost
        ? context.budget / service.estimated_cost >= 0.8 &&
          context.budget / service.estimated_cost <= 1.2
        : false;
    factors.push({
      preference: 'Budget',
      match: budgetMatch,
      weight: 0.2,
      impact: budgetMatch ? 20 : 0,
    });

    // Quality factor
    factors.push({
      preference: 'Quality',
      match: true, // Simplified - would need contractor rating data
      weight: 0.1,
      impact: 10,
    });

    // Usage history factor
    const usageMatch = profile.learningInsights.mostUsedServices.some(s =>
      s.service.toLowerCase().includes(service.service_name.toLowerCase())
    );
    factors.push({
      preference: 'Usage History',
      match: usageMatch,
      weight: 0.1,
      impact: usageMatch ? 10 : 0,
    });

    return factors;
  }

  /**
   * Update user profile based on current preferences
   */
  private async updateUserProfile(userId: string): Promise<void> {
    const preferences = this.getUserPreferences(userId);

    const profile: UserPreferenceProfile = {
      userId,
      preferences,
      behaviorPatterns: {
        preferredEventTypes: this.extractPreferredEventTypes(preferences),
        preferredServiceCategories:
          this.extractPreferredServiceCategories(preferences),
        averageBudget: this.calculateAverageBudget(preferences),
        preferredLocations: this.extractPreferredLocations(preferences),
        timePreferences: {
          preferredDays: ['weekend'],
          preferredTimes: ['evening'],
          advanceBookingDays: 30,
        },
        qualityPreferences: {
          minRating: 4.0,
          preferVerified: true,
          preferPremium: false,
        },
        communicationPreferences: {
          preferredContactMethod: 'email',
          responseTimeExpectation: '24h',
          notificationFrequency: 'daily',
        },
      },
      learningInsights: {
        mostUsedServices: this.calculateMostUsedServices(preferences),
        seasonalPatterns: this.calculateSeasonalPatterns(preferences),
        budgetPatterns: this.calculateBudgetPatterns(preferences),
        locationPatterns: this.calculateLocationPatterns(preferences),
      },
      lastUpdated: new Date(),
    };

    this.profiles.set(userId, profile);
  }

  /**
   * Update event type preference
   */
  private async updateEventTypePreference(
    userId: string,
    eventType: string
  ): Promise<void> {
    const existingPreference = this.getPreference(userId, 'event_type');
    if (existingPreference) {
      const eventTypes = existingPreference.preferenceData.eventTypes || [];
      if (!eventTypes.includes(eventType)) {
        eventTypes.push(eventType);
      }
      await this.setPreference(
        userId,
        'event_type',
        { eventTypes },
        existingPreference.weight
      );
    } else {
      await this.setPreference(
        userId,
        'event_type',
        { eventTypes: [eventType] },
        0.7
      );
    }
  }

  /**
   * Update service category preference
   */
  private async updateServiceCategoryPreference(
    userId: string,
    category: string
  ): Promise<void> {
    const existingPreference = this.getPreference(userId, 'service_category');
    if (existingPreference) {
      const categories = existingPreference.preferenceData.categories || [];
      if (!categories.includes(category)) {
        categories.push(category);
      }
      await this.setPreference(
        userId,
        'service_category',
        { categories },
        existingPreference.weight
      );
    } else {
      await this.setPreference(
        userId,
        'service_category',
        { categories: [category] },
        0.8
      );
    }
  }

  /**
   * Update budget preference
   */
  private async updateBudgetPreference(
    userId: string,
    budget: number
  ): Promise<void> {
    const existingPreference = this.getPreference(userId, 'price_range');
    if (existingPreference) {
      const budgets = existingPreference.preferenceData.budgets || [];
      budgets.push(budget);
      const averageBudget =
        budgets.reduce((sum: number, b: number) => sum + b, 0) / budgets.length;
      await this.setPreference(
        userId,
        'price_range',
        {
          budgets,
          averageBudget,
          minBudget: Math.min(...budgets),
          maxBudget: Math.max(...budgets),
        },
        existingPreference.weight
      );
    } else {
      await this.setPreference(
        userId,
        'price_range',
        {
          budgets: [budget],
          averageBudget: budget,
          minBudget: budget,
          maxBudget: budget,
        },
        0.6
      );
    }
  }

  /**
   * Update location preference
   */
  private async updateLocationPreference(
    userId: string,
    location: string
  ): Promise<void> {
    const existingPreference = this.getPreference(userId, 'location');
    if (existingPreference) {
      const locations = existingPreference.preferenceData.locations || [];
      if (!locations.includes(location)) {
        locations.push(location);
      }
      await this.setPreference(
        userId,
        'location',
        { locations },
        existingPreference.weight
      );
    } else {
      await this.setPreference(
        userId,
        'location',
        { locations: [location] },
        0.5
      );
    }
  }

  /**
   * Update rating preference
   */
  private async updateRatingPreference(
    userId: string,
    rating: number
  ): Promise<void> {
    const existingPreference = this.getPreference(userId, 'contractor_rating');
    if (existingPreference) {
      const ratings = existingPreference.preferenceData.ratings || [];
      ratings.push(rating);
      const averageRating =
        ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
      await this.setPreference(
        userId,
        'contractor_rating',
        {
          ratings,
          averageRating,
          minRating: Math.min(...ratings),
        },
        existingPreference.weight
      );
    } else {
      await this.setPreference(
        userId,
        'contractor_rating',
        {
          ratings: [rating],
          averageRating: rating,
          minRating: rating,
        },
        0.7
      );
    }
  }

  /**
   * Update service selection preference
   */
  private async updateServiceSelectionPreference(
    userId: string,
    services: string[]
  ): Promise<void> {
    const existingPreference = this.getPreference(userId, 'service_category');
    if (existingPreference) {
      const selectedServices =
        existingPreference.preferenceData.selectedServices || [];
      services.forEach(service => {
        if (!selectedServices.includes(service)) {
          selectedServices.push(service);
        }
      });
      await this.setPreference(
        userId,
        'service_category',
        {
          ...existingPreference.preferenceData,
          selectedServices,
        },
        existingPreference.weight
      );
    }
  }

  /**
   * Update feedback preference
   */
  private async updateFeedbackPreference(
    userId: string,
    feedback: any[]
  ): Promise<void> {
    // Process feedback to update preferences
    feedback.forEach(fb => {
      if (fb.rating >= 4) {
        // Positive feedback - strengthen related preferences
        this.updateServiceCategoryPreference(userId, fb.serviceId);
      }
    });
  }

  // Helper methods
  private extractPreferredEventTypes(preferences: UserPreference[]): string[] {
    const eventTypePreference = preferences.find(
      p => p.preferenceType === 'event_type'
    );
    return eventTypePreference?.preferenceData?.eventTypes || [];
  }

  private extractPreferredServiceCategories(
    preferences: UserPreference[]
  ): string[] {
    const categoryPreference = preferences.find(
      p => p.preferenceType === 'service_category'
    );
    return categoryPreference?.preferenceData?.categories || [];
  }

  private calculateAverageBudget(preferences: UserPreference[]): number {
    const budgetPreference = preferences.find(
      p => p.preferenceType === 'price_range'
    );
    return budgetPreference?.preferenceData?.averageBudget || 0;
  }

  private extractPreferredLocations(preferences: UserPreference[]): string[] {
    const locationPreference = preferences.find(
      p => p.preferenceType === 'location'
    );
    return locationPreference?.preferenceData?.locations || [];
  }

  private calculateMostUsedServices(
    preferences: UserPreference[]
  ): Array<{ service: string; count: number }> {
    const categoryPreference = preferences.find(
      p => p.preferenceType === 'service_category'
    );
    const selectedServices =
      categoryPreference?.preferenceData?.selectedServices || [];

    const serviceCounts: Record<string, number> = {};
    selectedServices.forEach((service: string) => {
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });

    return Object.entries(serviceCounts)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateSeasonalPatterns(
    preferences: UserPreference[]
  ): Record<string, number> {
    // Simplified seasonal pattern calculation
    return {
      spring: 0.8,
      summer: 0.9,
      autumn: 0.7,
      winter: 0.6,
    };
  }

  private calculateBudgetPatterns(
    preferences: UserPreference[]
  ): Array<{ eventType: string; averageBudget: number }> {
    // Simplified budget pattern calculation
    return [
      { eventType: 'wedding', averageBudget: 15000 },
      { eventType: 'corporate', averageBudget: 8000 },
      { eventType: 'birthday', averageBudget: 3000 },
    ];
  }

  private calculateLocationPatterns(
    preferences: UserPreference[]
  ): Array<{ location: string; frequency: number }> {
    const locations = this.extractPreferredLocations(preferences);
    return locations.map(location => ({ location, frequency: 1 }));
  }

  private getSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
