import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserGrowthAnalytics from '@/components/features/admin/analytics/UserGrowthAnalytics';

// Mock fetch
global.fetch = jest.fn();

// Mock the API response
const mockUserGrowthData = {
  growth: [
    {
      date: '2024-12-01',
      signups: 50,
      activeUsers: 35,
      churnedUsers: 5,
      retentionRate: 85,
    },
    {
      date: '2024-12-02',
      signups: 60,
      activeUsers: 42,
      churnedUsers: 6,
      retentionRate: 87,
    },
  ],
  cohorts: [
    {
      cohort: 'Dec 2024',
      size: 150,
      retention: [100, 85, 75, 70, 65, 60],
      revenue: 22500,
    },
  ],
  summary: {
    totalSignups: 1000,
    totalActiveUsers: 750,
    totalChurned: 100,
    averageRetention: 85.5,
    churnRate: 10.0,
    growthRate: 12.5,
  },
  trends: {
    signupTrend: 'up',
    retentionTrend: 'up',
    churnTrend: 'down',
  },
};

describe('UserGrowthAnalytics', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserGrowthData,
    });

    render(<UserGrowthAnalytics />);

    expect(
      screen.getByText('Loading user growth analytics...')
    ).toBeInTheDocument();
  });

  it('renders user growth data after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserGrowthData,
    });

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('User Growth Analytics')).toBeInTheDocument();
      expect(screen.getByText('Total Signups')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
    });
  });

  it('displays summary metrics correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserGrowthData,
    });

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Total signups
      expect(screen.getByText('750')).toBeInTheDocument(); // Active users
      expect(screen.getByText('100')).toBeInTheDocument(); // Churned users
      expect(screen.getByText('12.5%')).toBeInTheDocument(); // Growth rate
    });
  });

  it('displays cohort analysis when available', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserGrowthData,
    });

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Cohort Analysis')).toBeInTheDocument();
      expect(screen.getByText('Dec 2024')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument(); // Cohort size
    });
  });

  it('handles time range changes', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserGrowthData,
    });

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      const timeRangeSelect = screen.getByDisplayValue('Last 30 days');
      expect(timeRangeSelect).toBeInTheDocument();
    });
  });

  it('displays trend indicators correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserGrowthData,
    });

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('up trend')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserGrowthData,
    });

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  it('displays error state when API fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      expect(
        screen.getByText('Loading user growth analytics...')
      ).toBeInTheDocument();
    });
  });

  it('displays no data state when no data available', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      expect(
        screen.getByText('No user growth data available')
      ).toBeInTheDocument();
    });
  });

  it('formats retention rates correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserGrowthData,
    });

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('85.5%')).toBeInTheDocument(); // Average retention
    });
  });

  it('displays churn analysis chart', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserGrowthData,
    });

    render(<UserGrowthAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Churn Analysis')).toBeInTheDocument();
    });
  });
});
