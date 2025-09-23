import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecommendationAnalytics } from '@/components/features/ai/RecommendationAnalytics';

// Mock fetch
global.fetch = jest.fn();

describe('RecommendationAnalytics', () => {
  const mockAnalytics = {
    recommendation_analytics: {
      total_requests: 1250,
      total_feedback: 450,
      feedback_rate: 36,
      average_rating: 4.2,
      event_type_breakdown: {
        wedding: 600,
        corporate: 400,
        birthday: 250,
      },
      feedback_breakdown: {
        positive: 300,
        negative: 50,
        neutral: 100,
      },
      top_event_types: [
        { event_type: 'wedding', count: 600 },
        { event_type: 'corporate', count: 400 },
        { event_type: 'birthday', count: 250 },
      ],
    },
    engagement_analytics: {
      total_interactions: 2500,
      click_through_rate: 15.0,
      conversion_rate: 8.0,
      action_breakdown: {
        view: 1000,
        select: 500,
        feedback_positive: 300,
        feedback_negative: 50,
      },
      average_session_duration: 120,
      bounce_rate: 25.0,
    },
    learning_analytics: {
      total_learning_events: 150,
      average_success_rate: 0.85,
      total_patterns: 45,
      high_confidence_patterns: 30,
      pattern_confidence_rate: 75,
      learning_velocity: 3.2,
    },
    ab_testing_analytics: {
      total_tests: 5,
      variant_a_participants: 200,
      variant_b_participants: 200,
      variant_a_success_rate: 12.0,
      variant_b_success_rate: 15.0,
      winning_variant: 'B',
      statistical_significance: true,
    },
    performance_analytics: {
      total_api_requests: 5000,
      average_response_time: 150,
      error_rate: 1.5,
      uptime_percentage: 99.5,
      cache_hit_rate: 85.0,
      throughput: 200.0,
    },
    metadata: {
      time_period: 'month',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      generated_at: '2024-01-31T23:59:59Z',
    },
  };

  const mockProps = {
    eventType: 'wedding',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockAnalytics,
    });
  });

  it('renders recommendation analytics', async () => {
    render(<RecommendationAnalytics {...mockProps} />);

    await waitFor(() => {
      expect(
        screen.getByText('AI Recommendation Analytics')
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('Feedback Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Rating')).toBeInTheDocument();
    });
  });

  it('displays key metrics correctly', async () => {
    render(<RecommendationAnalytics {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('1250')).toBeInTheDocument(); // Total Requests
      expect(screen.getByText('36%')).toBeInTheDocument(); // Feedback Rate
      expect(screen.getByText('4.2')).toBeInTheDocument(); // Avg Rating
    });
  });

  it('shows top event types breakdown', async () => {
    render(<RecommendationAnalytics {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Top Event Types')).toBeInTheDocument();
      expect(screen.getByText('wedding')).toBeInTheDocument();
      expect(screen.getByText('600')).toBeInTheDocument();
      expect(screen.getByText('corporate')).toBeInTheDocument();
      expect(screen.getByText('400')).toBeInTheDocument();
    });
  });

  it('displays system health metrics', async () => {
    render(<RecommendationAnalytics {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('Uptime')).toBeInTheDocument();
      expect(screen.getByText('99.5%')).toBeInTheDocument();
      expect(screen.getByText('Response Time')).toBeInTheDocument();
      expect(screen.getByText('150ms')).toBeInTheDocument();
    });
  });

  it('shows engagement analytics tab', async () => {
    render(<RecommendationAnalytics {...mockProps} />);

    // Check that the Engagement tab is present
    await waitFor(() => {
      expect(screen.getByText('Engagement')).toBeInTheDocument();
    });

    // Click on Engagement tab
    const engagementTab = screen.getByText('Engagement');
    fireEvent.click(engagementTab);

    // The tab should be clickable (we can't easily test the content without more complex setup)
    expect(engagementTab).toBeInTheDocument();
  });

  it('handles time period selection', async () => {
    render(<RecommendationAnalytics {...mockProps} />);

    await waitFor(() => {
      const timePeriodSelect = screen.getByDisplayValue('Last Month');
      fireEvent.change(timePeriodSelect, { target: { value: 'week' } });
    });

    // Verify the fetch was called with the new time period
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('time_period=week')
    );
  });

  it('shows learning analytics tab', async () => {
    render(<RecommendationAnalytics {...mockProps} />);

    // Check that the Learning tab is present
    await waitFor(() => {
      expect(screen.getByText('Learning')).toBeInTheDocument();
    });

    // Click on Learning tab
    const learningTab = screen.getByText('Learning');
    fireEvent.click(learningTab);

    // The tab should be clickable
    expect(learningTab).toBeInTheDocument();
  });

  it('shows performance analytics tab', async () => {
    render(<RecommendationAnalytics {...mockProps} />);

    // Check that the Performance tab is present
    await waitFor(() => {
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });

    // Click on Performance tab
    const performanceTab = screen.getByText('Performance');
    fireEvent.click(performanceTab);

    // The tab should be clickable
    expect(performanceTab).toBeInTheDocument();
  });

  it('handles close button click', async () => {
    render(<RecommendationAnalytics {...mockProps} />);

    await waitFor(() => {
      // Find the close button by looking for the X icon
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
    });

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<RecommendationAnalytics {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Analytics Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<RecommendationAnalytics {...mockProps} />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });
});
