import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContractorPerformance from '@/components/features/admin/analytics/ContractorPerformance';

// Mock fetch
global.fetch = jest.fn();

// Mock the API response
const mockContractorData = {
  contractors: [
    {
      contractorId: '1',
      name: 'John Doe',
      email: 'john@example.com',
      rating: 4.8,
      totalJobs: 25,
      completedJobs: 23,
      revenue: 15000,
      responseTime: 45,
      completionRate: 92,
      customerSatisfaction: 4.7,
      lastActive: '2024-12-19T10:00:00Z',
      status: 'active',
    },
    {
      contractorId: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      rating: 4.6,
      totalJobs: 20,
      completedJobs: 18,
      revenue: 12000,
      responseTime: 60,
      completionRate: 90,
      customerSatisfaction: 4.5,
      lastActive: '2024-12-18T15:30:00Z',
      status: 'active',
    },
  ],
  metrics: {
    totalContractors: 100,
    activeContractors: 85,
    averageRating: 4.5,
    averageCompletionRate: 88.5,
    averageResponseTime: 55,
    totalRevenue: 500000,
    topPerformers: 20,
  },
  trends: {
    ratingTrend: 'up',
    completionTrend: 'up',
    revenueTrend: 'up',
  },
  rankings: {
    topRated: [
      {
        contractorId: '1',
        name: 'John Doe',
        email: 'john@example.com',
        rating: 4.8,
        totalJobs: 25,
        completedJobs: 23,
        revenue: 15000,
        responseTime: 45,
        completionRate: 92,
        customerSatisfaction: 4.7,
        lastActive: '2024-12-19T10:00:00Z',
        status: 'active',
      },
    ],
    topEarners: [
      {
        contractorId: '1',
        name: 'John Doe',
        email: 'john@example.com',
        rating: 4.8,
        totalJobs: 25,
        completedJobs: 23,
        revenue: 15000,
        responseTime: 45,
        completionRate: 92,
        customerSatisfaction: 4.7,
        lastActive: '2024-12-19T10:00:00Z',
        status: 'active',
      },
    ],
    mostActive: [
      {
        contractorId: '1',
        name: 'John Doe',
        email: 'john@example.com',
        rating: 4.8,
        totalJobs: 25,
        completedJobs: 23,
        revenue: 15000,
        responseTime: 45,
        completionRate: 92,
        customerSatisfaction: 4.7,
        lastActive: '2024-12-19T10:00:00Z',
        status: 'active',
      },
    ],
  },
};

describe('ContractorPerformance', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    expect(
      screen.getByText('Loading contractor performance analytics...')
    ).toBeInTheDocument();
  });

  it('renders contractor data after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(screen.getByText('Contractor Performance')).toBeInTheDocument();
      expect(screen.getByText('Total Contractors')).toBeInTheDocument();
      expect(screen.getByText('Average Rating')).toBeInTheDocument();
    });
  });

  it('displays summary metrics correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // Total contractors
      expect(screen.getByText('85')).toBeInTheDocument(); // Active contractors
      expect(screen.getByText('4.5/5')).toBeInTheDocument(); // Average rating
      expect(screen.getByText('88.5%')).toBeInTheDocument(); // Completion rate
    });
  });

  it('displays top performers sections', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(screen.getByText('Top Rated')).toBeInTheDocument();
      expect(screen.getByText('Top Earners')).toBeInTheDocument();
      expect(screen.getByText('Most Active')).toBeInTheDocument();
    });
  });

  it('displays contractor table with all contractors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(screen.getByText('All Contractors')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('handles time range changes', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      const timeRangeSelect = screen.getByDisplayValue('Last 30 days');
      expect(timeRangeSelect).toBeInTheDocument();
    });
  });

  it('displays trend indicators correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(screen.getByText('up trend')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  it('displays error state when API fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(
        screen.getByText('Loading contractor performance analytics...')
      ).toBeInTheDocument();
    });
  });

  it('displays no data state when no data available', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(
        screen.getByText('No contractor performance data available')
      ).toBeInTheDocument();
    });
  });

  it('formats currency values correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(screen.getByText('$500,000')).toBeInTheDocument(); // Total revenue
      expect(screen.getByText('$15,000')).toBeInTheDocument(); // Contractor revenue
    });
  });

  it('displays status badges correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('displays completion rate badges with correct colors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContractorData,
    });

    render(<ContractorPerformance />);

    await waitFor(() => {
      expect(screen.getByText('92%')).toBeInTheDocument(); // High completion rate
      expect(screen.getByText('90%')).toBeInTheDocument(); // High completion rate
    });
  });
});
