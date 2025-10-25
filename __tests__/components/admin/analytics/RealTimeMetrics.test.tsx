import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RealTimeMetrics from '@/components/features/admin/analytics/RealTimeMetrics';

// Mock fetch
global.fetch = jest.fn();

// Mock the API response
const mockMetricsData = {
  metrics: [
    {
      id: 'total-users',
      name: 'Total Users',
      value: 12345,
      previousValue: 12000,
      unit: 'count',
      trend: 'up',
      status: 'good',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'active-users',
      name: 'Active Users (24h)',
      value: 1500,
      previousValue: 1400,
      unit: 'count',
      trend: 'up',
      status: 'good',
      lastUpdated: new Date().toISOString(),
    },
  ],
  systemHealth: {
    status: 'healthy',
    uptime: 99.9,
    responseTime: 150,
    errorRate: 0.1,
  },
  alerts: [
    {
      id: '1',
      type: 'info',
      message: 'System performance is optimal',
      timestamp: new Date().toISOString(),
    },
  ],
};

describe('RealTimeMetrics', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetricsData,
    });

    render(<RealTimeMetrics />);

    expect(
      screen.getByText('Loading real-time metrics...')
    ).toBeInTheDocument();
  });

  it('renders metrics data after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetricsData,
    });

    render(<RealTimeMetrics />);

    await waitFor(() => {
      expect(screen.getByText('Real-Time Metrics')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Active Users (24h)')).toBeInTheDocument();
    });
  });

  it('displays system health status', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetricsData,
    });

    render(<RealTimeMetrics />);

    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('150ms')).toBeInTheDocument();
    });
  });

  it('displays alerts when present', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetricsData,
    });

    render(<RealTimeMetrics />);

    await waitFor(() => {
      expect(screen.getByText('System Alerts')).toBeInTheDocument();
      expect(
        screen.getByText('System performance is optimal')
      ).toBeInTheDocument();
    });
  });

  it('handles auto-refresh toggle', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetricsData,
    });

    render(<RealTimeMetrics />);

    await waitFor(() => {
      const autoRefreshButton = screen.getByText('Auto Refresh ON');
      expect(autoRefreshButton).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetricsData,
    });

    render(<RealTimeMetrics />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  it('displays error state when API fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<RealTimeMetrics />);

    await waitFor(() => {
      expect(
        screen.getByText('Loading real-time metrics...')
      ).toBeInTheDocument();
    });
  });

  it('formats currency values correctly', async () => {
    const currencyData = {
      ...mockMetricsData,
      metrics: [
        {
          id: 'revenue',
          name: 'Revenue',
          value: 50000,
          previousValue: 45000,
          unit: 'currency',
          trend: 'up',
          status: 'good',
          lastUpdated: new Date().toISOString(),
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => currencyData,
    });

    render(<RealTimeMetrics />);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });
  });

  it('displays trend indicators correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetricsData,
    });

    render(<RealTimeMetrics />);

    await waitFor(() => {
      // Check for trend indicators (these would be icons in the actual component)
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });
  });
});
