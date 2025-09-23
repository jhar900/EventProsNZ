import { ServiceRecommendation } from '@/types/contractors';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  variants: ABTestVariant[];
  targetAudience: {
    eventTypes?: string[];
    userSegments?: string[];
    locations?: string[];
    minExperience?: number;
  };
  metrics: ABTestMetrics;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of traffic (0-100)
  configuration: {
    algorithmVersion?: string;
    recommendationCount?: number;
    priorityWeighting?: Record<string, number>;
    personalizationLevel?: 'low' | 'medium' | 'high';
    uiLayout?: 'grid' | 'list' | 'carousel';
    showConfidenceScores?: boolean;
    showPricing?: boolean;
    showReviews?: boolean;
  };
  isControl: boolean;
}

export interface ABTestMetrics {
  totalParticipants: number;
  variants: {
    [variantId: string]: {
      participants: number;
      conversions: number;
      conversionRate: number;
      averageEngagement: number;
      averageRating: number;
      averageTimeOnPage: number;
      bounceRate: number;
      revenue: number;
      costPerConversion: number;
    };
  };
  statisticalSignificance: {
    isSignificant: boolean;
    confidenceLevel: number;
    pValue: number;
    winner?: string;
    improvement?: number;
  };
}

export interface ABTestResult {
  testId: string;
  userId: string;
  variantId: string;
  timestamp: Date;
  action: 'view' | 'click' | 'select' | 'dismiss' | 'feedback';
  metadata?: Record<string, any>;
}

export interface ABTestParticipant {
  userId: string;
  testId: string;
  variantId: string;
  assignedAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export class ABTestingEngine {
  private static instance: ABTestingEngine;
  private tests: Map<string, ABTest> = new Map();
  private participants: Map<string, ABTestParticipant[]> = new Map();
  private results: ABTestResult[] = [];

  static getInstance(): ABTestingEngine {
    if (!ABTestingEngine.instance) {
      ABTestingEngine.instance = new ABTestingEngine();
    }
    return ABTestingEngine.instance;
  }

  /**
   * Create a new A/B test
   */
  async createTest(
    testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>
  ): Promise<ABTest> {
    const test: ABTest = {
      ...testData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: {
        totalParticipants: 0,
        variants: {},
        statisticalSignificance: {
          isSignificant: false,
          confidenceLevel: 0,
          pValue: 1,
        },
      },
    };

    // Initialize variant metrics
    test.variants.forEach(variant => {
      test.metrics.variants[variant.id] = {
        participants: 0,
        conversions: 0,
        conversionRate: 0,
        averageEngagement: 0,
        averageRating: 0,
        averageTimeOnPage: 0,
        bounceRate: 0,
        revenue: 0,
        costPerConversion: 0,
      };
    });

    this.tests.set(test.id, test);
    return test;
  }

  /**
   * Get a test by ID
   */
  getTest(testId: string): ABTest | null {
    return this.tests.get(testId) || null;
  }

  /**
   * Get all tests
   */
  getAllTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  /**
   * Update a test
   */
  async updateTest(
    testId: string,
    updates: Partial<ABTest>
  ): Promise<ABTest | null> {
    const test = this.tests.get(testId);
    if (!test) return null;

    const updatedTest = {
      ...test,
      ...updates,
      updatedAt: new Date(),
    };

    this.tests.set(testId, updatedTest);
    return updatedTest;
  }

  /**
   * Start a test
   */
  async startTest(testId: string): Promise<boolean> {
    const test = this.tests.get(testId);
    if (!test) return false;

    if (test.status !== 'draft') return false;

    test.status = 'active';
    test.startDate = new Date();
    test.updatedAt = new Date();

    this.tests.set(testId, test);
    return true;
  }

  /**
   * Pause a test
   */
  async pauseTest(testId: string): Promise<boolean> {
    const test = this.tests.get(testId);
    if (!test) return false;

    if (test.status !== 'active') return false;

    test.status = 'paused';
    test.updatedAt = new Date();

    this.tests.set(testId, test);
    return true;
  }

  /**
   * Complete a test
   */
  async completeTest(testId: string): Promise<boolean> {
    const test = this.tests.get(testId);
    if (!test) return false;

    if (test.status !== 'active' && test.status !== 'paused') return false;

    test.status = 'completed';
    test.endDate = new Date();
    test.updatedAt = new Date();

    // Calculate final metrics
    await this.calculateTestMetrics(testId);

    this.tests.set(testId, test);
    return true;
  }

  /**
   * Assign a user to a test variant
   */
  async assignUserToTest(
    userId: string,
    testId: string
  ): Promise<string | null> {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'active') return null;

    // Check if user is already assigned
    const existingParticipant = this.getUserParticipant(userId, testId);
    if (existingParticipant) {
      return existingParticipant.variantId;
    }

    // Check if user matches target audience
    if (!this.userMatchesTargetAudience(userId, test.targetAudience)) {
      return null;
    }

    // Assign variant based on weights
    const variantId = this.selectVariant(test.variants);
    if (!variantId) return null;

    const participant: ABTestParticipant = {
      userId,
      testId,
      variantId,
      assignedAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
    };

    // Add to participants
    if (!this.participants.has(userId)) {
      this.participants.set(userId, []);
    }
    this.participants.get(userId)!.push(participant);

    // Update test metrics
    test.metrics.totalParticipants++;
    test.metrics.variants[variantId].participants++;

    this.tests.set(testId, test);
    return variantId;
  }

  /**
   * Record a test result
   */
  async recordResult(result: Omit<ABTestResult, 'timestamp'>): Promise<void> {
    const testResult: ABTestResult = {
      ...result,
      timestamp: new Date(),
    };

    this.results.push(testResult);

    // Update participant activity
    const participant = this.getUserParticipant(result.userId, result.testId);
    if (participant) {
      participant.lastActivity = new Date();
    }

    // Update test metrics
    await this.updateTestMetrics(
      result.testId,
      result.variantId,
      result.action,
      result.metadata
    );
  }

  /**
   * Get user's assigned variant for a test
   */
  getUserVariant(userId: string, testId: string): string | null {
    const participant = this.getUserParticipant(userId, testId);
    return participant?.variantId || null;
  }

  /**
   * Get test results for a specific test
   */
  getTestResults(testId: string): ABTestResult[] {
    return this.results.filter(result => result.testId === testId);
  }

  /**
   * Get test participants
   */
  getTestParticipants(testId: string): ABTestParticipant[] {
    const allParticipants: ABTestParticipant[] = [];
    this.participants.forEach(participants => {
      allParticipants.push(...participants.filter(p => p.testId === testId));
    });
    return allParticipants;
  }

  /**
   * Calculate test metrics
   */
  async calculateTestMetrics(testId: string): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) return;

    const testResults = this.getTestResults(testId);
    const participants = this.getTestParticipants(testId);

    // Calculate metrics for each variant
    test.variants.forEach(variant => {
      const variantResults = testResults.filter(
        r => r.variantId === variant.id
      );
      const variantParticipants = participants.filter(
        p => p.variantId === variant.id
      );

      const conversions = variantResults.filter(
        r => r.action === 'select'
      ).length;
      const totalViews = variantResults.filter(r => r.action === 'view').length;
      const totalClicks = variantResults.filter(
        r => r.action === 'click'
      ).length;

      const conversionRate =
        totalViews > 0 ? (conversions / totalViews) * 100 : 0;
      const engagement = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

      // Calculate average rating from feedback
      const feedbackResults = variantResults.filter(
        r => r.action === 'feedback' && r.metadata?.rating
      );
      const averageRating =
        feedbackResults.length > 0
          ? feedbackResults.reduce(
              (sum, r) => sum + (r.metadata?.rating || 0),
              0
            ) / feedbackResults.length
          : 0;

      // Calculate time on page (simplified)
      const timeOnPage = variantResults.length > 0 ? 120 : 0; // Mock calculation

      // Calculate bounce rate
      const bounces = variantResults.filter(
        r =>
          r.action === 'view' &&
          !variantResults.some(
            r2 => r2.userId === r.userId && r2.action !== 'view'
          )
      ).length;
      const bounceRate = totalViews > 0 ? (bounces / totalViews) * 100 : 0;

      test.metrics.variants[variant.id] = {
        participants: variantParticipants.length,
        conversions,
        conversionRate,
        averageEngagement: engagement,
        averageRating,
        averageTimeOnPage: timeOnPage,
        bounceRate,
        revenue: conversions * 100, // Mock revenue calculation
        costPerConversion: conversions > 0 ? 50 : 0, // Mock cost calculation
      };
    });

    // Calculate statistical significance
    await this.calculateStatisticalSignificance(test);

    this.tests.set(testId, test);
  }

  /**
   * Calculate statistical significance
   */
  private async calculateStatisticalSignificance(test: ABTest): Promise<void> {
    const variants = test.variants;
    const variantIds = Object.keys(variants);

    if (variantIds.length < 2) return;

    // Find control variant
    const controlVariant =
      variants[variantIds.find(id => variants[id].isControl) || variantIds[0]];
    const testVariant =
      variants[variantIds.find(id => !variants[id].isControl) || variantIds[1]];

    if (!controlVariant || !testVariant) return;

    // Simplified statistical significance calculation
    const controlRate = controlVariant.conversionRate / 100;
    const testRate = testVariant.conversionRate / 100;
    const controlSample = controlVariant.participants;
    const testSample = testVariant.participants;

    if (controlSample < 30 || testSample < 30) {
      test.metrics.statisticalSignificance = {
        isSignificant: false,
        confidenceLevel: 0,
        pValue: 1,
      };
      return;
    }

    // Calculate p-value using two-proportion z-test
    const pooledRate =
      (controlVariant.conversions + testVariant.conversions) /
      (controlSample + testSample);
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / controlSample + 1 / testSample)
    );
    const zScore = Math.abs(testRate - controlRate) / standardError;

    // Approximate p-value (simplified)
    const pValue = Math.max(0, 1 - zScore / 1.96);
    const confidenceLevel = (1 - pValue) * 100;

    const isSignificant = pValue < 0.05 && confidenceLevel >= 95;
    const improvement =
      controlRate > 0 ? ((testRate - controlRate) / controlRate) * 100 : 0;

    test.metrics.statisticalSignificance = {
      isSignificant,
      confidenceLevel,
      pValue,
      winner:
        isSignificant && improvement > 0 ? testVariant.id : controlVariant.id,
      improvement: Math.abs(improvement),
    };
  }

  /**
   * Update test metrics based on new result
   */
  private async updateTestMetrics(
    testId: string,
    variantId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const test = this.tests.get(testId);
    if (!test) return;

    const variantMetrics = test.metrics.variants[variantId];
    if (!variantMetrics) return;

    // Update metrics based on action
    switch (action) {
      case 'view':
        // Increment view count (handled in calculateTestMetrics)
        break;
      case 'click':
        // Increment click count (handled in calculateTestMetrics)
        break;
      case 'select':
        variantMetrics.conversions++;
        break;
      case 'feedback':
        if (metadata?.rating) {
          // Update average rating
          const currentTotal =
            variantMetrics.averageRating * (variantMetrics.conversions - 1);
          variantMetrics.averageRating =
            (currentTotal + metadata.rating) / variantMetrics.conversions;
        }
        break;
    }

    // Recalculate derived metrics
    const totalViews = this.results.filter(
      r =>
        r.testId === testId && r.variantId === variantId && r.action === 'view'
    ).length;
    const totalClicks = this.results.filter(
      r =>
        r.testId === testId && r.variantId === variantId && r.action === 'click'
    ).length;

    variantMetrics.conversionRate =
      totalViews > 0 ? (variantMetrics.conversions / totalViews) * 100 : 0;
    variantMetrics.averageEngagement =
      totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    this.tests.set(testId, test);
  }

  /**
   * Select a variant based on weights
   */
  private selectVariant(variants: ABTestVariant[]): string | null {
    if (variants.length === 0) return null;

    const totalWeight = variants.reduce(
      (sum, variant) => sum + variant.weight,
      0
    );
    if (totalWeight === 0) return variants[0].id;

    const random = Math.random() * totalWeight;
    let currentWeight = 0;

    for (const variant of variants) {
      currentWeight += variant.weight;
      if (random <= currentWeight) {
        return variant.id;
      }
    }

    return variants[variants.length - 1].id;
  }

  /**
   * Check if user matches target audience
   */
  private userMatchesTargetAudience(
    userId: string,
    targetAudience: ABTest['targetAudience']
  ): boolean {
    // Simplified implementation - in reality, this would check user profile data
    // For now, always return true
    return true;
  }

  /**
   * Get user participant for a test
   */
  private getUserParticipant(
    userId: string,
    testId: string
  ): ABTestParticipant | null {
    const userParticipants = this.participants.get(userId) || [];
    return userParticipants.find(p => p.testId === testId) || null;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get test analytics
   */
  getTestAnalytics(testId: string): {
    test: ABTest;
    participants: ABTestParticipant[];
    results: ABTestResult[];
    dailyMetrics: Array<{
      date: string;
      variants: Record<
        string,
        {
          views: number;
          clicks: number;
          conversions: number;
          revenue: number;
        }
      >;
    }>;
  } | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const participants = this.getTestParticipants(testId);
    const results = this.getTestResults(testId);

    // Calculate daily metrics
    const dailyMetrics = this.calculateDailyMetrics(testId, results);

    return {
      test,
      participants,
      results,
      dailyMetrics,
    };
  }

  /**
   * Calculate daily metrics
   */
  private calculateDailyMetrics(
    testId: string,
    results: ABTestResult[]
  ): Array<{
    date: string;
    variants: Record<
      string,
      {
        views: number;
        clicks: number;
        conversions: number;
        revenue: number;
      }
    >;
  }> {
    const dailyData: Record<
      string,
      Record<
        string,
        { views: number; clicks: number; conversions: number; revenue: number }
      >
    > = {};

    results.forEach(result => {
      const date = result.timestamp.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = {};
      }
      if (!dailyData[date][result.variantId]) {
        dailyData[date][result.variantId] = {
          views: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        };
      }

      switch (result.action) {
        case 'view':
          dailyData[date][result.variantId].views++;
          break;
        case 'click':
          dailyData[date][result.variantId].clicks++;
          break;
        case 'select':
          dailyData[date][result.variantId].conversions++;
          dailyData[date][result.variantId].revenue += 100; // Mock revenue
          break;
      }
    });

    return Object.entries(dailyData).map(([date, variants]) => ({
      date,
      variants,
    }));
  }
}
