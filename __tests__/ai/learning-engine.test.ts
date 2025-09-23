import { AILearningEngine, LearningData } from '@/lib/ai/learning-engine';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
    })),
    insert: jest.fn().mockResolvedValue({
      data: { id: 'test-id' },
      error: null,
    }),
    update: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })),
  })),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('AILearningEngine', () => {
  let learningEngine: AILearningEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    learningEngine = AILearningEngine.getInstance();
  });

  afterEach(() => {
    // Clear learning data between tests
    learningEngine.clearOldData(0);
  });

  describe('recordInteraction', () => {
    it('should record user interaction data', async () => {
      const interactionData = {
        userId: 'user123',
        eventType: 'wedding',
        serviceId: 'photography-service',
        action: 'select' as const,
        context: {
          eventData: { budget: 10000, guestCount: 100 },
          userPreferences: { priceSensitivity: 'medium' },
        },
      };

      await learningEngine.recordInteraction(interactionData);

      const stats = learningEngine.getLearningStats();
      expect(stats.totalInteractions).toBe(1);
    });

    it('should generate insights from interactions', async () => {
      // Record multiple interactions to generate insights
      const interactions = [
        {
          userId: 'user123',
          eventType: 'wedding',
          serviceId: 'photography-service',
          action: 'select' as const,
          context: { eventData: { budget: 10000 } },
        },
        {
          userId: 'user123',
          eventType: 'wedding',
          serviceId: 'catering-service',
          action: 'select' as const,
          context: { eventData: { budget: 10000 } },
        },
        {
          userId: 'user456',
          eventType: 'wedding',
          serviceId: 'photography-service',
          action: 'feedback_positive' as const,
          context: { eventData: { budget: 15000 } },
        },
      ];

      for (const interaction of interactions) {
        await learningEngine.recordInteraction(interaction);
      }

      const insights = learningEngine.getInsights();
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  describe('generateRecommendationImprovements', () => {
    it('should generate improvements based on service popularity', async () => {
      // Record positive interactions for a service
      const positiveInteractions = Array(10)
        .fill(null)
        .map((_, i) => ({
          userId: `user${i}`,
          eventType: 'wedding',
          serviceId: 'photography-service',
          action: 'feedback_positive' as const,
          context: { eventData: { budget: 10000 } },
        }));

      for (const interaction of positiveInteractions) {
        await learningEngine.recordInteraction(interaction);
      }

      const improvements =
        await learningEngine.generateRecommendationImprovements('wedding');

      const photographyImprovement = improvements.find(
        imp => imp.serviceId === 'photography-service'
      );
      expect(photographyImprovement).toBeDefined();
      expect(
        photographyImprovement?.improvement.priorityAdjustment
      ).toBeGreaterThan(0);
    });

    it('should generate improvements based on user preferences', async () => {
      // Record user interactions showing preference for photography
      const userInteractions = [
        {
          userId: 'user123',
          eventType: 'wedding',
          serviceId: 'photography-service',
          action: 'select' as const,
          context: { eventData: { budget: 10000 } },
        },
        {
          userId: 'user123',
          eventType: 'corporate',
          serviceId: 'photography-service',
          action: 'select' as const,
          context: { eventData: { budget: 5000 } },
        },
        {
          userId: 'user123',
          eventType: 'birthday',
          serviceId: 'photography-service',
          action: 'select' as const,
          context: { eventData: { budget: 2000 } },
        },
      ];

      for (const interaction of userInteractions) {
        await learningEngine.recordInteraction(interaction);
      }

      const improvements =
        await learningEngine.generateRecommendationImprovements(
          'wedding',
          'user123'
        );

      const photographyImprovement = improvements.find(
        imp => imp.serviceId === 'photography-service'
      );
      expect(photographyImprovement).toBeDefined();
      expect(
        photographyImprovement?.improvement.priorityAdjustment
      ).toBeGreaterThan(0);
    });
  });

  describe('getInsights', () => {
    it('should return insights filtered by type', async () => {
      // Record interactions to generate different types of insights
      const interactions = [
        {
          userId: 'user123',
          eventType: 'wedding',
          serviceId: 'photography-service',
          action: 'select' as const,
          context: { eventData: { budget: 10000, location: 'Auckland' } },
        },
        {
          userId: 'user456',
          eventType: 'wedding',
          serviceId: 'catering-service',
          action: 'select' as const,
          context: { eventData: { budget: 15000, location: 'Auckland' } },
        },
      ];

      for (const interaction of interactions) {
        await learningEngine.recordInteraction(interaction);
      }

      const servicePopularityInsights =
        learningEngine.getInsights('service_popularity');
      const userPreferenceInsights =
        learningEngine.getInsights('user_preference');
      const locationInsights = learningEngine.getInsights(
        'location_preference'
      );

      expect(
        servicePopularityInsights.every(
          insight => insight.type === 'service_popularity'
        )
      ).toBe(true);
      expect(
        userPreferenceInsights.every(
          insight => insight.type === 'user_preference'
        )
      ).toBe(true);
      expect(
        locationInsights.every(
          insight => insight.type === 'location_preference'
        )
      ).toBe(true);
    });

    it('should return insights filtered by event type', async () => {
      const interactions = [
        {
          userId: 'user123',
          eventType: 'wedding',
          serviceId: 'photography-service',
          action: 'select' as const,
          context: { eventData: { budget: 10000 } },
        },
        {
          userId: 'user456',
          eventType: 'corporate',
          serviceId: 'av-equipment-service',
          action: 'select' as const,
          context: { eventData: { budget: 5000 } },
        },
      ];

      for (const interaction of interactions) {
        await learningEngine.recordInteraction(interaction);
      }

      const weddingInsights = learningEngine.getInsights(undefined, 'wedding');
      const corporateInsights = learningEngine.getInsights(
        undefined,
        'corporate'
      );

      expect(
        weddingInsights.every(
          insight =>
            insight.data.eventType === 'wedding' ||
            insight.data.eventType === undefined
        )
      ).toBe(true);
      expect(
        corporateInsights.every(
          insight =>
            insight.data.eventType === 'corporate' ||
            insight.data.eventType === undefined
        )
      ).toBe(true);
    });
  });

  describe('getLearningStats', () => {
    it('should return correct learning statistics', async () => {
      const interactions = [
        {
          userId: 'user123',
          eventType: 'wedding',
          serviceId: 'photography-service',
          action: 'select' as const,
          context: { eventData: { budget: 10000 } },
        },
        {
          userId: 'user456',
          eventType: 'wedding',
          serviceId: 'catering-service',
          action: 'feedback_positive' as const,
          context: { eventData: { budget: 15000 } },
        },
      ];

      for (const interaction of interactions) {
        await learningEngine.recordInteraction(interaction);
      }

      const stats = learningEngine.getLearningStats();

      expect(stats.totalInteractions).toBe(2);
      expect(stats.totalInsights).toBeGreaterThan(0);
      expect(stats.insightsByType).toBeDefined();
      expect(stats.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(stats.averageConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe('clearOldData', () => {
    it('should clear old learning data', async () => {
      // Record some interactions
      const interaction = {
        userId: 'user123',
        eventType: 'wedding',
        serviceId: 'photography-service',
        action: 'select' as const,
        context: { eventData: { budget: 10000 } },
      };

      await learningEngine.recordInteraction(interaction);

      let stats = learningEngine.getLearningStats();
      expect(stats.totalInteractions).toBe(1);

      // Clear all data (0 days to keep)
      learningEngine.clearOldData(0);

      stats = learningEngine.getLearningStats();
      expect(stats.totalInteractions).toBe(0);
      expect(stats.totalInsights).toBe(0);
    });
  });

  describe('seasonal analysis', () => {
    it('should analyze seasonal trends', async () => {
      // Mock different seasons by setting different months
      const winterInteraction = {
        userId: 'user123',
        eventType: 'wedding',
        serviceId: 'indoor-venue-service',
        action: 'select' as const,
        context: { eventData: { budget: 10000 } },
      };

      // Simulate winter interaction (January)
      const originalDate = Date;
      global.Date = jest.fn(() => new originalDate('2024-01-15')) as any;
      global.Date.now = originalDate.now;

      await learningEngine.recordInteraction(winterInteraction);

      const seasonalInsights = learningEngine.getInsights('seasonal_trend');
      expect(seasonalInsights.length).toBeGreaterThan(0);

      const winterInsight = seasonalInsights.find(
        insight => insight.data.season === 'winter'
      );
      expect(winterInsight).toBeDefined();

      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('event pattern analysis', () => {
    it('should identify common service combinations', async () => {
      // Record interactions that show service combinations
      const session1 = [
        {
          userId: 'user123',
          eventType: 'wedding',
          serviceId: 'photography-service',
          action: 'select' as const,
          context: { eventData: { budget: 10000 } },
        },
        {
          userId: 'user123',
          eventType: 'wedding',
          serviceId: 'catering-service',
          action: 'select' as const,
          context: { eventData: { budget: 10000 } },
        },
      ];

      const session2 = [
        {
          userId: 'user456',
          eventType: 'wedding',
          serviceId: 'photography-service',
          action: 'select' as const,
          context: { eventData: { budget: 15000 } },
        },
        {
          userId: 'user456',
          eventType: 'wedding',
          serviceId: 'catering-service',
          action: 'select' as const,
          context: { eventData: { budget: 15000 } },
        },
      ];

      // Record all interactions
      [...session1, ...session2].forEach(async interaction => {
        await learningEngine.recordInteraction(interaction);
      });

      const eventPatternInsights = learningEngine.getInsights('event_pattern');
      expect(eventPatternInsights.length).toBeGreaterThan(0);

      const weddingPattern = eventPatternInsights.find(
        insight => insight.data.eventType === 'wedding'
      );
      expect(weddingPattern).toBeDefined();
      expect(weddingPattern?.data.serviceCombinations).toBeDefined();
    });
  });
});
