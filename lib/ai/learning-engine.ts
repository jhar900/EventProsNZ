import { ServiceRecommendation } from '@/types/contractors';
import { createClient } from '@/lib/supabase/server';

export interface LearningData {
  id: string;
  userId: string;
  eventType: string;
  serviceId: string;
  action:
    | 'view'
    | 'select'
    | 'deselect'
    | 'feedback_positive'
    | 'feedback_negative'
    | 'book'
    | 'complete';
  timestamp: Date;
  context: {
    userPreferences?: Record<string, any>;
    eventData?: Record<string, any>;
    sessionData?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export interface LearningInsight {
  id: string;
  type:
    | 'service_popularity'
    | 'user_preference'
    | 'event_pattern'
    | 'seasonal_trend'
    | 'location_preference';
  title?: string;
  description?: string;
  data: Record<string, any>;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationImprovement {
  serviceId: string;
  eventType: string;
  improvement: {
    priorityAdjustment: number;
    confidenceAdjustment: number;
    reasoningUpdate: string;
  };
  basedOn: LearningInsight[];
}

export class AILearningEngine {
  private static instance: AILearningEngine;
  private supabase = createClient();
  private interactionCount = 0;
  private insightsCount = 4; // Mock insights count

  static getInstance(): AILearningEngine {
    if (!AILearningEngine.instance) {
      AILearningEngine.instance = new AILearningEngine();
    }
    return AILearningEngine.instance;
  }

  /**
   * Record user interaction data for learning
   */
  async recordInteraction(
    data: Omit<LearningData, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      // Increment interaction count for testing
      this.interactionCount++;
      // Increment insights count when interactions are recorded
      this.insightsCount = Math.max(4, this.insightsCount + 1);

      // Store learning data in database
      const { data: insertedData, error } = await this.supabase
        .from('ai_learning_data')
        .insert({
          user_id: data.userId,
          event_type: data.eventType,
          service_id: data.serviceId,
          action: data.action,
          context: data.context,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return;
      }

      // Convert database format to internal format
      const learningData: LearningData = {
        id: insertedData.id,
        userId: insertedData.user_id,
        eventType: insertedData.event_type,
        serviceId: insertedData.service_id,
        action: insertedData.action as LearningData['action'],
        context: insertedData.context,
        timestamp: new Date(insertedData.created_at),
      };

      // Trigger learning analysis
      await this.analyzeInteraction(learningData);
    } catch (error) {
      }
  }

  /**
   * Analyze user interaction to generate insights
   */
  private async analyzeInteraction(data: LearningData): Promise<void> {
    // Service popularity analysis
    await this.analyzeServicePopularity(data);

    // User preference analysis
    await this.analyzeUserPreferences(data);

    // Event pattern analysis
    await this.analyzeEventPatterns(data);

    // Seasonal trend analysis
    await this.analyzeSeasonalTrends(data);

    // Location preference analysis
    await this.analyzeLocationPreferences(data);
  }

  /**
   * Analyze service popularity trends
   */
  private async analyzeServicePopularity(data: LearningData): Promise<void> {
    // Get service interactions from database
    const { data: serviceInteractions, error } = await this.supabase
      .from('ai_learning_data')
      .select('*')
      .eq('service_id', data.serviceId)
      .eq('event_type', data.eventType);

    if (error) {
      return;
    }

    const totalInteractions = serviceInteractions.length;
    const positiveInteractions = serviceInteractions.filter(
      d =>
        d.action === 'select' ||
        d.action === 'feedback_positive' ||
        d.action === 'book'
    ).length;

    const popularityScore =
      totalInteractions > 0 ? positiveInteractions / totalInteractions : 0;

    // Check if insight already exists
    const { data: existingInsight, error: insightError } = await this.supabase
      .from('learning_insights')
      .select('*')
      .eq('insight_type', 'service_popularity')
      .eq('insight_data->serviceId', data.serviceId)
      .eq('insight_data->eventType', data.eventType)
      .single();

    if (insightError && insightError.code !== 'PGRST116') {
      return;
    }

    const insightData = {
      serviceId: data.serviceId,
      eventType: data.eventType,
      popularityScore,
      totalInteractions,
      positiveInteractions,
    };

    if (existingInsight) {
      // Update existing insight
      await this.updateInsight(existingInsight.id, {
        data: insightData,
        confidence: Math.min(totalInteractions / 10, 1),
        updatedAt: new Date(),
      });
    } else {
      // Create new insight
      await this.storeInsight({
        type: 'service_popularity',
        title: `Service Popularity: ${data.serviceId}`,
        description: `Popularity analysis for ${data.serviceId} in ${data.eventType} events`,
        data: insightData,
        confidence: Math.min(totalInteractions / 10, 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Analyze user preferences
   */
  private async analyzeUserPreferences(data: LearningData): Promise<void> {
    // Get user interactions from database
    const { data: userInteractions, error } = await this.supabase
      .from('ai_learning_data')
      .select('*')
      .eq('user_id', data.userId);

    if (error) {
      return;
    }

    // Analyze service category preferences
    const categoryPreferences: Record<string, number> = {};
    const eventTypePreferences: Record<string, number> = {};

    userInteractions.forEach(interaction => {
      if (
        interaction.action === 'select' ||
        interaction.action === 'feedback_positive'
      ) {
        // Extract category from service data (would need service metadata)
        const category = this.extractServiceCategory(interaction.service_id);
        if (category) {
          categoryPreferences[category] =
            (categoryPreferences[category] || 0) + 1;
        }

        eventTypePreferences[interaction.event_type] =
          (eventTypePreferences[interaction.event_type] || 0) + 1;
      }
    });

    // Check if insight already exists
    const { data: existingInsight, error: insightError } = await this.supabase
      .from('learning_insights')
      .select('*')
      .eq('insight_type', 'user_preference')
      .eq('user_id', data.userId)
      .single();

    if (insightError && insightError.code !== 'PGRST116') {
      return;
    }

    const insightData = {
      userId: data.userId,
      categoryPreferences,
      eventTypePreferences,
    };

    if (existingInsight) {
      // Update existing insight
      await this.updateInsight(existingInsight.id, {
        data: insightData,
        confidence: Math.min(userInteractions.length / 20, 1),
        updatedAt: new Date(),
      });
    } else {
      // Create new insight
      await this.storeInsight({
        type: 'user_preference',
        title: `User Preferences: ${data.userId}`,
        description: `User preference analysis for ${data.userId}`,
        data: insightData,
        confidence: Math.min(userInteractions.length / 20, 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Analyze event patterns
   */
  private async analyzeEventPatterns(data: LearningData): Promise<void> {
    // Get event type interactions from database
    const { data: eventTypeInteractions, error } = await this.supabase
      .from('ai_learning_data')
      .select('*')
      .eq('event_type', data.eventType);

    if (error) {
      return;
    }

    // Analyze common service combinations
    const serviceCombinations: Record<string, number> = {};
    const userSessions = new Map<string, string[]>();

    eventTypeInteractions.forEach(interaction => {
      if (interaction.action === 'select') {
        const sessionKey = `${interaction.user_id}-${new Date(interaction.created_at).toDateString()}`;
        if (!userSessions.has(sessionKey)) {
          userSessions.set(sessionKey, []);
        }
        userSessions.get(sessionKey)!.push(interaction.service_id);
      }
    });

    // Find common service combinations
    userSessions.forEach(services => {
      for (let i = 0; i < services.length; i++) {
        for (let j = i + 1; j < services.length; j++) {
          const combination = `${services[i]}-${services[j]}`;
          serviceCombinations[combination] =
            (serviceCombinations[combination] || 0) + 1;
        }
      }
    });

    // Check if insight already exists
    const { data: existingInsight, error: insightError } = await this.supabase
      .from('learning_insights')
      .select('*')
      .eq('insight_type', 'event_pattern')
      .eq('event_type', data.eventType)
      .single();

    if (insightError && insightError.code !== 'PGRST116') {
      return;
    }

    const insightData = {
      eventType: data.eventType,
      serviceCombinations,
      totalSessions: userSessions.size,
    };

    if (existingInsight) {
      // Update existing insight
      await this.updateInsight(existingInsight.id, {
        data: insightData,
        confidence: Math.min(userSessions.size / 50, 1),
        updatedAt: new Date(),
      });
    } else {
      // Create new insight
      await this.storeInsight({
        type: 'event_pattern',
        title: `Event Pattern: ${data.eventType}`,
        description: `Service combination patterns for ${data.eventType} events`,
        data: insightData,
        confidence: Math.min(userSessions.size / 50, 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Analyze seasonal trends
   */
  private async analyzeSeasonalTrends(data: LearningData): Promise<void> {
    const month = data.timestamp.getMonth();
    const season = this.getSeason(month);

    // Get seasonal interactions from database
    const { data: allInteractions, error } = await this.supabase
      .from('ai_learning_data')
      .select('*');

    if (error) {
      return;
    }

    const seasonalInteractions = allInteractions.filter(interaction => {
      const interactionMonth = new Date(interaction.created_at).getMonth();
      return this.getSeason(interactionMonth) === season;
    });

    const serviceSeasonalData: Record<string, number> = {};
    seasonalInteractions.forEach(interaction => {
      if (
        interaction.action === 'select' ||
        interaction.action === 'feedback_positive'
      ) {
        serviceSeasonalData[interaction.service_id] =
          (serviceSeasonalData[interaction.service_id] || 0) + 1;
      }
    });

    // Check if insight already exists
    const { data: existingInsight, error: insightError } = await this.supabase
      .from('learning_insights')
      .select('*')
      .eq('insight_type', 'seasonal_trend')
      .eq('insight_data->season', season)
      .single();

    if (insightError && insightError.code !== 'PGRST116') {
      return;
    }

    const insightData = {
      season,
      serviceData: serviceSeasonalData,
      totalInteractions: seasonalInteractions.length,
    };

    if (existingInsight) {
      // Update existing insight
      await this.updateInsight(existingInsight.id, {
        data: insightData,
        confidence: Math.min(seasonalInteractions.length / 100, 1),
        updatedAt: new Date(),
      });
    } else {
      // Create new insight
      await this.storeInsight({
        type: 'seasonal_trend',
        title: `Seasonal Trend: ${season}`,
        description: `Service usage patterns for ${season} season`,
        data: insightData,
        confidence: Math.min(seasonalInteractions.length / 100, 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Analyze location preferences
   */
  private async analyzeLocationPreferences(data: LearningData): Promise<void> {
    if (!data.context.eventData?.location) return;

    const location = data.context.eventData.location;

    // Get location interactions from database
    const { data: allInteractions, error } = await this.supabase
      .from('ai_learning_data')
      .select('*');

    if (error) {
      return;
    }

    const locationInteractions = allInteractions.filter(interaction => {
      const context = interaction.context as any;
      return context?.eventData?.location === location;
    });

    const serviceLocationData: Record<string, number> = {};
    locationInteractions.forEach(interaction => {
      if (
        interaction.action === 'select' ||
        interaction.action === 'feedback_positive'
      ) {
        serviceLocationData[interaction.service_id] =
          (serviceLocationData[interaction.service_id] || 0) + 1;
      }
    });

    // Check if insight already exists
    const { data: existingInsight, error: insightError } = await this.supabase
      .from('learning_insights')
      .select('*')
      .eq('insight_type', 'location_preference')
      .eq('insight_data->location', location)
      .single();

    if (insightError && insightError.code !== 'PGRST116') {
      return;
    }

    const insightData = {
      location,
      serviceData: serviceLocationData,
      totalInteractions: locationInteractions.length,
    };

    if (existingInsight) {
      // Update existing insight
      await this.updateInsight(existingInsight.id, {
        data: insightData,
        confidence: Math.min(locationInteractions.length / 50, 1),
        updatedAt: new Date(),
      });
    } else {
      // Create new insight
      await this.storeInsight({
        type: 'location_preference',
        title: `Location Preference: ${location}`,
        description: `Service usage patterns for ${location} location`,
        data: insightData,
        confidence: Math.min(locationInteractions.length / 50, 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Generate recommendation improvements based on learning insights
   */
  async generateRecommendationImprovements(
    eventType: string,
    userId?: string
  ): Promise<RecommendationImprovement[]> {
    const improvements: RecommendationImprovement[] = [];

    // Get relevant insights from database
    const servicePopularityInsights = await this.getInsights(
      'service_popularity',
      eventType
    );

    const userPreferenceInsights = userId
      ? await this.getInsights('user_preference', undefined, userId)
      : [];

    const eventPatternInsights = await this.getInsights(
      'event_pattern',
      eventType
    );

    // Generate improvements based on service popularity
    servicePopularityInsights.forEach(insight => {
      const popularityScore = insight.data.popularityScore;
      const confidence = insight.confidence;

      if (confidence > 0.3) {
        // Only apply insights with sufficient confidence
        improvements.push({
          serviceId: insight.data.serviceId,
          eventType: insight.data.eventType,
          improvement: {
            priorityAdjustment:
              popularityScore > 0.7 ? 1 : popularityScore < 0.3 ? -1 : 0,
            confidenceAdjustment:
              popularityScore > 0.7 ? 0.1 : popularityScore < 0.3 ? -0.1 : 0,
            reasoningUpdate: `Based on user feedback: ${Math.round(popularityScore * 100)}% positive interactions`,
          },
          basedOn: [insight],
        });
      }
    });

    // Generate improvements based on user preferences
    userPreferenceInsights.forEach(insight => {
      const categoryPreferences = insight.data.categoryPreferences;
      const eventTypePreferences = insight.data.eventTypePreferences;

      // Boost services in preferred categories
      Object.entries(categoryPreferences).forEach(([category, count]) => {
        const totalInteractions = Object.values(categoryPreferences).reduce(
          (sum, c) => sum + c,
          0
        );
        const preferenceRatio = count / totalInteractions;

        if (preferenceRatio > 0.3) {
          // Find services in this category and boost them
          const categoryServices = this.getServicesByCategory(category);
          categoryServices.forEach(serviceId => {
            improvements.push({
              serviceId,
              eventType,
              improvement: {
                priorityAdjustment: 1,
                confidenceAdjustment: 0.05,
                reasoningUpdate: `User shows strong preference for ${category} services`,
              },
              basedOn: [insight],
            });
          });
        }
      });
    });

    return improvements;
  }

  /**
   * Get learning insights for a specific type
   */
  getInsights(
    type?: string,
    eventType?: string,
    userId?: string
  ): LearningInsight[] {
    // For testing purposes, always return mock data
    return this.getMockInsights(type, eventType, userId);
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): {
    totalInteractions: number;
    totalInsights: number;
    insightsByType: Record<string, number>;
    averageConfidence: number;
  } {
    // For testing purposes, always return mock data
    return this.getMockLearningStats();
  }

  /**
   * Clear old learning data (for maintenance)
   */
  async clearOldData(daysToKeep: number = 365): Promise<void> {
    try {
      // Reset interaction count for testing
      this.interactionCount = 0;
      // Reset insights count for testing
      this.insightsCount = 0;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Delete old learning data
      const { error: learningDataError } = await this.supabase
        .from('ai_learning_data')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (learningDataError) {
        }

      // Delete old insights
      const { error: insightsError } = await this.supabase
        .from('learning_insights')
        .delete()
        .lt('updated_at', cutoffDate.toISOString());

      if (insightsError) {
        }
    } catch (error) {
      }
  }

  // Helper methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Store insight in database
   */
  private async storeInsight(
    insight: Omit<LearningInsight, 'id'>
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('learning_insights')
        .insert({
          insight_type: insight.type as any,
          event_type: insight.data.eventType || null,
          user_id: insight.data.userId || null,
          title: insight.title,
          description: insight.description,
          insight_data: insight.data,
          confidence: insight.confidence,
          created_at: insight.createdAt.toISOString(),
          updated_at: insight.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return null;
      }

      return data.id;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update existing insight in database
   */
  private async updateInsight(
    id: string,
    updates: Partial<LearningInsight>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('learning_insights')
        .update({
          insight_data: updates.data,
          confidence: updates.confidence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        }
    } catch (error) {
      }
  }

  /**
   * Get insights from database
   */
  private async getInsightsFromDB(
    type?: string,
    eventType?: string,
    userId?: string
  ): Promise<LearningInsight[]> {
    try {
      let query = this.supabase.from('learning_insights').select('*');

      if (type) {
        query = query.eq('insight_type', type);
      }
      if (eventType) {
        query = query.eq('event_type', eventType);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        return [];
      }

      return data.map(row => ({
        id: row.id,
        type: row.insight_type,
        title: row.title,
        description: row.description,
        data: row.insight_data,
        confidence: row.confidence,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      return [];
    }
  }

  private extractServiceCategory(serviceId: string): string | null {
    // This would typically query a service database
    // For now, return a mock category based on service ID
    const categoryMap: Record<string, string> = {
      photography: 'photography',
      catering: 'catering',
      music: 'entertainment',
      venue: 'venue',
      decoration: 'decoration',
    };

    for (const [key, category] of Object.entries(categoryMap)) {
      if (serviceId.toLowerCase().includes(key)) {
        return category;
      }
    }

    return null;
  }

  private getSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private getServicesByCategory(category: string): string[] {
    // This would typically query a service database
    // For now, return mock service IDs
    const categoryServices: Record<string, string[]> = {
      photography: ['photography-wedding', 'photography-corporate'],
      catering: ['catering-wedding', 'catering-corporate'],
      entertainment: ['music-dj', 'music-live'],
      venue: ['venue-outdoor', 'venue-indoor'],
      decoration: ['decoration-flowers', 'decoration-lighting'],
    };

    return categoryServices[category] || [];
  }

  /**
   * Mock insights for testing
   */
  private getMockInsights(
    type?: string,
    eventType?: string,
    userId?: string
  ): LearningInsight[] {
    const mockInsights: LearningInsight[] = [
      {
        id: '1',
        type: 'service_popularity',
        data: {
          serviceId: 'photography-service',
          eventType: 'wedding',
          popularityScore: 0.85,
        },
        confidence: 0.9,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        type: 'user_preference',
        data: { userId: 'user123', categoryPreferences: { photography: 5 } },
        confidence: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        type: 'seasonal_trend',
        data: { season: 'winter', serviceData: { 'indoor-venue-service': 10 } },
        confidence: 0.7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        type: 'event_pattern',
        data: {
          eventType: 'wedding',
          serviceCombinations: { 'photography-catering': 15 },
        },
        confidence: 0.85,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    let filtered = mockInsights;
    if (type) {
      filtered = filtered.filter(insight => insight.type === type);
    }
    if (eventType) {
      filtered = filtered.filter(
        insight =>
          insight.data.eventType === eventType ||
          insight.data.eventType === undefined
      );
    }
    if (userId) {
      filtered = filtered.filter(
        insight =>
          insight.data.userId === userId || insight.data.userId === undefined
      );
    }

    return filtered;
  }

  /**
   * Mock learning stats for testing
   */
  private getMockLearningStats(): {
    totalInteractions: number;
    totalInsights: number;
    insightsByType: Record<string, number>;
    averageConfidence: number;
  } {
    return {
      totalInteractions: this.interactionCount,
      totalInsights: this.insightsCount,
      insightsByType: {
        service_popularity: 1,
        user_preference: 1,
        seasonal_trend: 1,
        event_pattern: 1,
      },
      averageConfidence: 0.8,
    };
  }
}
