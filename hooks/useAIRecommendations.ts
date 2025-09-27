'use client';

import { useState, useCallback } from 'react';
import { AILearningEngine } from '@/lib/ai/learning-engine';

interface ServiceRecommendation {
  id: string;
  event_type: string;
  service_category: string;
  service_name: string;
  priority: number;
  confidence_score: number;
  is_required: boolean;
  description?: string;
  estimated_cost?: number;
  created_at: string;
}

interface ServiceTemplate {
  id: string;
  name: string;
  event_type: string;
  services: Array<{
    service_category: string;
    priority: number;
    is_required: boolean;
    estimated_cost_percentage: number;
    description?: string;
  }>;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  usage_count?: number;
  rating?: number;
  description?: string;
}

interface UserPreference {
  id: string;
  user_id: string;
  preference_type: string;
  preference_data: any;
  created_at: string;
  updated_at: string;
}

interface ABTest {
  id: string;
  test_name: string;
  variant_a: any;
  variant_b: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metrics?: {
    variant_a: {
      total_participants: number;
      conversion_rate: number;
      average_engagement: number;
      average_rating: number;
    };
    variant_b: {
      total_participants: number;
      conversion_rate: number;
      average_engagement: number;
      average_rating: number;
    };
  };
  winning_variant?: string;
  total_participants: number;
  is_statistically_significant: boolean;
}

interface LearningData {
  patterns: any[];
  insights: any[];
  statistics: any;
}

interface AIRecommendationsState {
  recommendations: ServiceRecommendation[];
  templates: ServiceTemplate[];
  userPreferences: UserPreference[];
  abTests: ABTest[];
  learningData: LearningData;
  isLoading: boolean;
  error: string | null;
}

export function useAIRecommendations() {
  const [state, setState] = useState<AIRecommendationsState>({
    recommendations: [],
    templates: [],
    userPreferences: [],
    abTests: [],
    learningData: { patterns: [], insights: [], statistics: {} },
    isLoading: false,
    error: null,
  });

  const learningEngine = AILearningEngine.getInstance();

  const getRecommendations = useCallback(
    async (
      eventType: string,
      eventData?: {
        attendee_count?: number;
        budget?: number;
        location?: string;
        event_date?: string;
      }
    ) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const params = new URLSearchParams({
          event_type: eventType,
        });

        if (eventData) {
          if (eventData.attendee_count) {
            params.append(
              'attendee_count',
              eventData.attendee_count.toString()
            );
          }
          if (eventData.budget) {
            params.append('budget', eventData.budget.toString());
          }
          if (eventData.location) {
            params.append('location', eventData.location);
          }
          if (eventData.event_date) {
            params.append('event_date', eventData.event_date);
          }
        }

        const response = await fetch(
          `/api/ai/service-recommendations?${params}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();

        // Apply learning improvements to recommendations
        const improvements =
          await learningEngine.generateRecommendationImprovements(eventType);
        const improvedRecommendations =
          data.recommendations?.map((rec: ServiceRecommendation) => {
            const improvement = improvements.find(
              imp => imp.serviceId === rec.id
            );
            if (improvement) {
              return {
                ...rec,
                priority: Math.max(
                  1,
                  Math.min(
                    5,
                    rec.priority + improvement.improvement.priorityAdjustment
                  )
                ),
                confidence_score: Math.max(
                  0,
                  Math.min(
                    1,
                    rec.confidence_score +
                      improvement.improvement.confidenceAdjustment
                  )
                ),
                description:
                  improvement.improvement.reasoningUpdate || rec.description,
              };
            }
            return rec;
          }) || [];

        setState(prev => ({
          ...prev,
          recommendations: improvedRecommendations,
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to fetch recommendations',
          isLoading: false,
        }));
      }
    },
    []
  );

  const learnFromEvent = useCallback(
    async (eventId: string, services: string[], success: boolean) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch('/api/ai/learning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: eventId,
            services_used: services,
            success_metrics: {
              overall_rating: success ? 5 : 2,
              budget_variance: 0,
              timeline_adherence: 1,
              attendee_satisfaction: success ? 5 : 2,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to record learning data');
        }

        setState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to record learning data',
          isLoading: false,
        }));
      }
    },
    []
  );

  const updatePreferences = useCallback(
    async (preferences: UserPreference[]) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Update each preference
        for (const preference of preferences) {
          const response = await fetch('/api/ai/user-preferences', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              preference_type: preference.preference_type,
              preference_data: preference.preference_data,
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Failed to update ${preference.preference_type} preferences`
            );
          }
        }

        setState(prev => ({
          ...prev,
          userPreferences: preferences,
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update preferences',
          isLoading: false,
        }));
      }
    },
    []
  );

  const runABTest = useCallback(async (testId: string, variant: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/ai/ab-testing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_id: testId,
          variant,
          result_data: {
            recommendation_clicked: true,
            service_selected: false,
            conversion_rate: 0,
            engagement_score: 0.5,
            feedback_rating: 4,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record A/B test result');
      }

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to record A/B test result',
        isLoading: false,
      }));
    }
  }, []);

  const getConfidenceScores = useCallback(
    async (recommendations: ServiceRecommendation[]) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // This would typically call an API to get confidence scores
        // For now, we'll use the existing confidence scores
        const confidenceScores = recommendations.map(rec => ({
          recommendation_id: rec.id,
          confidence_score: rec.confidence_score,
          factors: {
            event_type_match: 0.8,
            user_preferences: 0.1,
            attendee_count: 0.05,
            budget_appropriateness: 0.05,
          },
        }));

        setState(prev => ({ ...prev, isLoading: false }));
        return confidenceScores;
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get confidence scores',
          isLoading: false,
        }));
        return [];
      }
    },
    []
  );

  const saveTemplate = useCallback(
    async (template: Partial<ServiceTemplate>) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch('/api/ai/service-templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(template),
        });

        if (!response.ok) {
          throw new Error('Failed to save template');
        }

        const data = await response.json();

        setState(prev => ({
          ...prev,
          templates: [data.template, ...prev.templates],
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Failed to save template',
          isLoading: false,
        }));
      }
    },
    []
  );

  const loadTemplates = useCallback(async (eventType?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      if (eventType) {
        params.append('event_type', eventType);
      }

      const response = await fetch(`/api/ai/service-templates?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load templates');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        templates: data.templates || [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to load templates',
        isLoading: false,
      }));
    }
  }, []);

  const loadUserPreferences = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/ai/user-preferences');

      if (!response.ok) {
        throw new Error('Failed to load user preferences');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        userPreferences: data.preferences || [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load user preferences',
        isLoading: false,
      }));
    }
  }, []);

  const loadABTests = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/ai/ab-testing');

      if (!response.ok) {
        throw new Error('Failed to load A/B tests');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        abTests: data.tests || [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error:
          error instanceof Error ? error.message : 'Failed to load A/B tests',
        isLoading: false,
      }));
    }
  }, []);

  const loadLearningData = useCallback(
    async (eventType?: string, timePeriod?: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const params = new URLSearchParams();
        if (eventType) {
          params.append('event_type', eventType);
        }
        if (timePeriod) {
          params.append('time_period', timePeriod);
        }

        const response = await fetch(`/api/ai/learning?${params}`);

        if (!response.ok) {
          throw new Error('Failed to load learning data');
        }

        const data = await response.json();

        setState(prev => ({
          ...prev,
          learningData: {
            patterns: data.patterns || [],
            insights: data.insights || [],
            statistics: data.statistics || {},
          },
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load learning data',
          isLoading: false,
        }));
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const recordInteraction = useCallback(
    async (
      serviceId: string,
      action:
        | 'view'
        | 'select'
        | 'deselect'
        | 'feedback_positive'
        | 'feedback_negative'
        | 'book'
        | 'complete',
      eventType: string,
      userId?: string,
      context?: Record<string, any>
    ) => {
      try {
        await learningEngine.recordInteraction({
          userId: userId || 'anonymous',
          eventType,
          serviceId,
          action,
          context: {
            eventData: context,
            userPreferences: state.userPreferences,
            sessionData: {
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
            },
          },
        });
      } catch (error) {
        }
    },
    [learningEngine, state.userPreferences]
  );

  return {
    // State
    recommendations: state.recommendations,
    templates: state.templates,
    userPreferences: state.userPreferences,
    abTests: state.abTests,
    learningData: state.learningData,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    getRecommendations,
    learnFromEvent,
    updatePreferences,
    runABTest,
    getConfidenceScores,
    saveTemplate,
    loadTemplates,
    loadUserPreferences,
    loadABTests,
    loadLearningData,
    clearError,
    recordInteraction,
  };
}
