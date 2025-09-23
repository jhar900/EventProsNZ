import { renderHook, act } from '@testing-library/react';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';

// Mock fetch
global.fetch = jest.fn();

// Mock AILearningEngine
jest.mock('@/lib/ai/learning-engine', () => ({
  AILearningEngine: {
    getInstance: jest.fn(() => ({
      generateRecommendationImprovements: jest.fn().mockResolvedValue([]),
      recordInteraction: jest.fn(),
    })),
  },
}));

describe('useAIRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get service recommendations successfully', async () => {
    const mockRecommendations = [
      {
        id: 'rec-1',
        event_type: 'wedding',
        service_category: 'Photography',
        service_name: 'Wedding Photography',
        priority: 5,
        confidence_score: 0.85,
        is_required: true,
        description: 'Essential for capturing memories',
        estimated_cost: 2000,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'rec-2',
        event_type: 'wedding',
        service_category: 'Catering',
        service_name: 'Wedding Catering',
        priority: 5,
        confidence_score: 0.9,
        is_required: true,
        description: 'Required for guest satisfaction',
        estimated_cost: 5000,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    const mockResponse = {
      recommendations: mockRecommendations,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.getRecommendations('wedding', {
        attendee_count: 100,
        budget: 20000,
      });
    });

    expect(result.current.recommendations).toEqual(mockRecommendations);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.getRecommendations('wedding', {
        attendee_count: 100,
        budget: 20000,
      });
    });

    expect(result.current.recommendations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should learn from event successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.learnFromEvent(
        'event-1',
        ['photography', 'catering'],
        true
      );
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle learning errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to record learning data')
    );

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.learnFromEvent('event-1', ['photography'], false);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to record learning data');
  });

  it('should update user preferences successfully', async () => {
    const mockPreferences = [
      {
        id: 'pref-1',
        user_id: 'user-1',
        preference_type: 'service_preferences',
        preference_data: {
          preferred_categories: ['Photography'],
          budget_range: { min: 1000, max: 3000 },
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.updatePreferences(mockPreferences);
    });

    expect(result.current.userPreferences).toEqual(mockPreferences);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle preferences errors gracefully', async () => {
    const mockPreferences = [
      {
        id: 'pref-1',
        user_id: 'user-1',
        preference_type: 'service_preferences',
        preference_data: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to update preferences')
    );

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.updatePreferences(mockPreferences);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to update preferences');
  });

  it('should clear error status', () => {
    const { result } = renderHook(() => useAIRecommendations());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should load AB tests successfully', async () => {
    const mockTests = [
      {
        id: 'test-1',
        test_name: 'Recommendation Algorithm Test',
        variant_a: { algorithm: 'original' },
        variant_b: { algorithm: 'ai-powered' },
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_participants: 100,
        is_statistically_significant: false,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tests: mockTests }),
    });

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.loadABTests();
    });

    expect(result.current.abTests).toEqual(mockTests);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load templates successfully', async () => {
    const mockTemplates = [
      {
        id: 'template-1',
        name: 'Wedding Template',
        event_type: 'wedding',
        services: [
          {
            service_category: 'Photography',
            priority: 5,
            is_required: true,
            estimated_cost_percentage: 0.1,
            description: 'Wedding photography',
          },
        ],
        is_public: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ templates: mockTemplates }),
    });

    const { result } = renderHook(() => useAIRecommendations());

    await act(async () => {
      await result.current.loadTemplates('wedding');
    });

    expect(result.current.templates).toEqual(mockTemplates);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
