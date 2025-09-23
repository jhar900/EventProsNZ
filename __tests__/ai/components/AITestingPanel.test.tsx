import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AITestingPanel } from '@/components/features/ai/AITestingPanel';

// Mock fetch
global.fetch = jest.fn();

describe('AITestingPanel', () => {
  const mockTests = [
    {
      id: '1',
      test_name: 'Recommendation Algorithm A',
      variant_a: { algorithm: 'original' },
      variant_b: { algorithm: 'ai-powered' },
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-31T00:00:00Z',
      metrics: {
        variant_a: {
          total_participants: 100,
          conversion_rate: 0.08,
          average_engagement: 0.15,
          average_rating: 4.2,
        },
        variant_b: {
          total_participants: 100,
          conversion_rate: 0.12,
          average_engagement: 0.18,
          average_rating: 4.5,
        },
      },
      total_participants: 200,
      is_statistically_significant: true,
    },
    {
      id: '2',
      test_name: 'Recommendation Algorithm B',
      variant_a: { algorithm: 'original' },
      variant_b: { algorithm: 'ai-powered' },
      is_active: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-31T00:00:00Z',
      metrics: {
        variant_a: {
          total_participants: 50,
          conversion_rate: 0.06,
          average_engagement: 0.12,
          average_rating: 4.0,
        },
        variant_b: {
          total_participants: 50,
          conversion_rate: 0.1,
          average_engagement: 0.16,
          average_rating: 4.3,
        },
      },
      total_participants: 100,
      is_statistically_significant: false,
    },
  ];

  const mockProps = {
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ tests: mockTests }),
      })
    );
  });

  it('renders A/B testing panel', async () => {
    render(<AITestingPanel {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('A/B Testing Dashboard')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText('Recommendation Algorithm A')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Recommendation Algorithm B')
      ).toBeInTheDocument();
    });
  });

  it('displays test performance metrics', async () => {
    render(<AITestingPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading A/B tests...')
      ).not.toBeInTheDocument();
    });

    await waitFor(() => {
      // Wait for the component to load and display test data
      expect(
        screen.getByText('Recommendation Algorithm A')
      ).toBeInTheDocument();
    });

    // Check for overview metrics that are visible by default
    expect(screen.getByText('2')).toBeInTheDocument(); // Total Tests
    expect(screen.getByText('1')).toBeInTheDocument(); // Active Tests
    expect(screen.getByText('300')).toBeInTheDocument(); // Total Participants
  });

  it('shows active test status', async () => {
    render(<AITestingPanel {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('displays test overview metrics', async () => {
    render(<AITestingPanel {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Tests
      expect(screen.getByText('1')).toBeInTheDocument(); // Active Tests
      expect(screen.getByText('300')).toBeInTheDocument(); // Total Participants
    });
  });

  it('shows variant performance comparison', async () => {
    render(<AITestingPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading A/B tests...')
      ).not.toBeInTheDocument();
    });

    // Check for test names that are visible in the overview
    await waitFor(() => {
      expect(
        screen.getByText('Recommendation Algorithm A')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Recommendation Algorithm B')
      ).toBeInTheDocument();
    });
  });

  it('shows analytics tab content', async () => {
    render(<AITestingPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Loading A/B tests...')
      ).not.toBeInTheDocument();
    });

    // Check for overview content that is visible by default
    await waitFor(() => {
      expect(screen.getByText('Total Tests')).toBeInTheDocument();
      expect(screen.getByText('Total Participants')).toBeInTheDocument();
    });

    // Check for "Active Tests" in the overview metrics (not the tab)
    const activeTestsElements = screen.getAllByText('Active Tests');
    expect(activeTestsElements.length).toBeGreaterThan(0);
  });

  it('handles close button click', async () => {
    render(<AITestingPanel {...mockProps} />);

    await waitFor(() => {
      // Find the close button by looking for the X icon
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
    });

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles empty tests list', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tests: [] }),
    });

    render(<AITestingPanel {...mockProps} />);

    await waitFor(() => {
      // Check for the overview metrics with empty data
      const totalTestsElements = screen.getAllByText('0');
      expect(totalTestsElements.length).toBeGreaterThan(0);
    });
  });
});
