import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceRecommendations } from '@/components/features/ai/ServiceRecommendations';

// Mock the useAIRecommendations hook
jest.mock('@/hooks/useAIRecommendations', () => ({
  useAIRecommendations: jest.fn(),
}));

// Mock the ServiceCategorySuggestions component
jest.mock('@/components/features/ai/ServiceCategorySuggestions', () => ({
  ServiceCategorySuggestions: ({ recommendations, onFeedback }: any) => (
    <div data-testid="service-category-suggestions">
      {recommendations.map((rec: any) => (
        <div key={rec.id} data-testid={`recommendation-${rec.id}`}>
          <span>{rec.service_category}</span>
          <button
            onClick={() => onFeedback(rec.id, 'positive', 5)}
            data-testid={`feedback-${rec.id}`}
          >
            Give Feedback
          </button>
        </div>
      ))}
    </div>
  ),
}));

// Mock the ServicePriorityIndicator component
jest.mock('@/components/features/ai/ServicePriorityIndicator', () => ({
  ServicePriorityIndicator: ({ priority, confidence }: any) => (
    <div data-testid="service-priority-indicator">
      Priority: {priority}, Confidence: {confidence}
    </div>
  ),
}));

// Mock the ServiceCustomization component
jest.mock('@/components/features/ai/ServiceCustomization', () => ({
  ServiceCustomization: ({ recommendations, onCustomize }: any) => (
    <div data-testid="service-customization">
      <button
        onClick={() => onCustomize('add', 'rec-1')}
        data-testid="add-service"
      >
        Add Service
      </button>
      <button
        onClick={() => onCustomize('remove', 'rec-1')}
        data-testid="remove-service"
      >
        Remove Service
      </button>
    </div>
  ),
}));

describe('ServiceRecommendations', () => {
  const mockRecommendations = [
    {
      id: 'rec-1',
      event_type: 'wedding',
      service_category: 'Photography',
      service_name: 'Photography',
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
      service_name: 'Catering',
      priority: 5,
      confidence_score: 0.9,
      is_required: true,
      description: 'Required for guest satisfaction',
      estimated_cost: 5000,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockConfidenceScores = {
    overall: 0.87,
    by_category: {
      Photography: 0.85,
      Catering: 0.9,
    },
  };

  const mockMetadata = {
    event_type: 'wedding',
    attendee_count: 100,
    budget: 20000,
  };

  const mockUseAIRecommendations = {
    recommendations: mockRecommendations,
    templates: [],
    userPreferences: [],
    abTests: [],
    isLoading: false,
    error: null,
    getRecommendations: jest.fn(),
    learnFromEvent: jest.fn(),
    updatePreferences: jest.fn(),
    runABTest: jest.fn(),
    getConfidenceScores: jest.fn(),
    saveTemplate: jest.fn(),
    loadTemplates: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useAIRecommendations } = require('@/hooks/useAIRecommendations');
    useAIRecommendations.mockReturnValue(mockUseAIRecommendations);
  });

  it('should render service recommendations correctly', () => {
    render(<ServiceRecommendations eventType="wedding" />);

    expect(screen.getByText('AI Service Recommendations')).toBeInTheDocument();
    expect(
      screen.getByText('Intelligent suggestions for your wedding')
    ).toBeInTheDocument();
  });

  it('should display loading state', () => {
    const { useAIRecommendations } = require('@/hooks/useAIRecommendations');
    useAIRecommendations.mockReturnValue({
      ...mockUseAIRecommendations,
      isLoading: true,
    });

    render(<ServiceRecommendations eventType="wedding" />);

    expect(screen.getByText('Loading recommendations...')).toBeInTheDocument();
  });

  it('should display error state', () => {
    const { useAIRecommendations } = require('@/hooks/useAIRecommendations');
    useAIRecommendations.mockReturnValue({
      ...mockUseAIRecommendations,
      error: 'Failed to fetch recommendations',
    });

    render(<ServiceRecommendations eventType="wedding" />);

    expect(
      screen.getByText(
        'Failed to load service recommendations. Please try again.'
      )
    ).toBeInTheDocument();
  });

  it('should handle feedback submission', async () => {
    const { useAIRecommendations } = require('@/hooks/useAIRecommendations');
    useAIRecommendations.mockReturnValue({
      ...mockUseAIRecommendations,
    });

    render(<ServiceRecommendations eventType="wedding" />);

    // Wait for recommendations to load
    await waitFor(() => {
      expect(screen.getByText('Photography')).toBeInTheDocument();
    });

    // Find and click the thumbs up button for the first recommendation
    const thumbsUpButtons = screen.getAllByRole('button');
    const thumbsUpButton = thumbsUpButtons.find(
      button =>
        button.querySelector('svg') &&
        button
          .querySelector('svg')
          ?.getAttribute('class')
          ?.includes('lucide-thumbs-up')
    );

    if (thumbsUpButton) {
      fireEvent.click(thumbsUpButton);
    }
  });

  it('should handle service customization', async () => {
    const { useAIRecommendations } = require('@/hooks/useAIRecommendations');
    useAIRecommendations.mockReturnValue({
      ...mockUseAIRecommendations,
    });

    render(<ServiceRecommendations eventType="wedding" />);

    // Wait for recommendations to load
    await waitFor(() => {
      expect(screen.getByText('Photography')).toBeInTheDocument();
    });

    // Find and click the "Add Service" button for the first recommendation
    const addServiceButtons = screen.getAllByText('Add Service');
    if (addServiceButtons.length > 0) {
      fireEvent.click(addServiceButtons[0]);
    }
  });

  it('should display recommendations when loaded', async () => {
    render(<ServiceRecommendations eventType="wedding" />);

    // Wait for recommendations to load
    await waitFor(() => {
      expect(screen.getByText('Photography')).toBeInTheDocument();
      expect(screen.getByText('Catering')).toBeInTheDocument();
    });

    // Check that the summary is displayed
    expect(screen.getByText('Recommendation Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Services')).toBeInTheDocument();
  });

  it('should handle empty recommendations', () => {
    const { useAIRecommendations } = require('@/hooks/useAIRecommendations');
    useAIRecommendations.mockReturnValue({
      ...mockUseAIRecommendations,
      recommendations: [],
    });

    render(<ServiceRecommendations eventType="wedding" />);

    // When there are no recommendations, the summary section should not be displayed
    expect(
      screen.queryByText('Recommendation Summary')
    ).not.toBeInTheDocument();
  });

  it('should display analytics and preferences buttons', () => {
    render(<ServiceRecommendations eventType="wedding" />);

    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });
});
