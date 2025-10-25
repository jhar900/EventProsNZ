import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RevenueAnalytics from '@/components/features/admin/analytics/RevenueAnalytics';

// Mock fetch
global.fetch = jest.fn();

// Mock the API response
const mockRevenueData = {
  revenue: [
    {
      date: '2024-12-01',
      totalRevenue: 5000,
      subscriptionRevenue: 3000,
      transactionRevenue: 2000,
      refunds: 100,
      netRevenue: 4900,
    },
    {
      date: '2024-12-02',
      totalRevenue: 5500,
      subscriptionRevenue: 3200,
      transactionRevenue: 2300,
      refunds: 150,
      netRevenue: 5350,
    },
  ],
  subscriptions: [
    {
      plan: 'Basic',
      subscribers: 100,
      revenue: 5000,
      churnRate: 5.0,
      growthRate: 10.0,
    },
    {
      plan: 'Pro',
      subscribers: 50,
      revenue: 7500,
      churnRate: 3.0,
      growthRate: 15.0,
    },
  ],
  summary: {
    totalRevenue: 50000,
    monthlyRecurringRevenue: 30000,
    averageTransactionValue: 150,
    revenueGrowth: 12.5,
    churnRate: 5.2,
    lifetimeValue: 1250,
  },
  trends: {
    revenueTrend: 'up',
    subscriptionTrend: 'up',
    churnTrend: 'down',
  },
  forecast: {
    nextMonth: 55000,
    nextQuarter: 65000,
    confidence: 85,
  },
};

describe('RevenueAnalytics', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    expect(
      screen.getByText('Loading revenue analytics...')
    ).toBeInTheDocument();
  });

  it('renders revenue data after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Revenue Analytics')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('MRR')).toBeInTheDocument();
    });
  });

  it('displays summary metrics correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument(); // Total revenue
      expect(screen.getByText('$30,000')).toBeInTheDocument(); // MRR
      expect(screen.getByText('$150')).toBeInTheDocument(); // Avg transaction
      expect(screen.getByText('$1,250')).toBeInTheDocument(); // Customer LTV
    });
  });

  it('displays revenue forecast', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
      expect(screen.getByText('$55,000')).toBeInTheDocument(); // Next month
      expect(screen.getByText('$65,000')).toBeInTheDocument(); // Next quarter
      expect(screen.getByText('85%')).toBeInTheDocument(); // Confidence
    });
  });

  it('displays subscription analytics', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Subscription Analytics')).toBeInTheDocument();
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });
  });

  it('handles time range changes', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      const timeRangeSelect = screen.getByDisplayValue('Last 30 days');
      expect(timeRangeSelect).toBeInTheDocument();
    });
  });

  it('displays trend indicators correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('up trend')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  it('displays error state when API fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<RevenueAnalytics />);

    await waitFor(() => {
      expect(
        screen.getByText('Loading revenue analytics...')
      ).toBeInTheDocument();
    });
  });

  it('displays no data state when no data available', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('No revenue data available')).toBeInTheDocument();
    });
  });

  it('formats currency values correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('$30,000')).toBeInTheDocument();
    });
  });

  it('displays subscription plan performance', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRevenueData,
    });

    render(<RevenueAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Basic subscribers
      expect(screen.getByText('50')).toBeInTheDocument(); // Pro subscribers
    });
  });
});
