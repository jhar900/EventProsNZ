import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '@/components/features/admin/AdminDashboard';

// Mock the useAdmin hook
jest.mock('@/hooks/useAdmin', () => ({
  useAdmin: () => ({
    fetchAnalytics: jest.fn(),
    fetchSystemHealth: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render dashboard with metrics when data is loaded', async () => {
    const mockAnalyticsData = {
      metrics: {
        totalUsers: 100,
        newUsers: 10,
        totalContractors: 50,
        verifiedContractors: 40,
        pendingVerifications: 40,
        totalEventManagers: 50,
        verificationRate: 80,
      },
      trends: {
        userGrowth: [1, 2, 3, 4, 5, 6, 7],
        verificationTrend: 5,
      },
    };

    const mockHealthData = {
      health: {
        status: 'healthy',
        alerts: [],
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('100')).toBeInTheDocument(); // Total Users
    expect(screen.getAllByText('50')).toHaveLength(2); // Total Contractors and Event Managers
    expect(screen.getByText('40')).toBeInTheDocument(); // Pending Verifications
  });

  it('should display system health status', async () => {
    const mockHealthData = {
      health: {
        status: 'healthy',
        alerts: [],
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ metrics: {}, trends: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });

    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('should display critical system health status', async () => {
    const mockHealthData = {
      health: {
        status: 'critical',
        alerts: [
          {
            id: '1',
            message: 'Database connection failed',
            severity: 'critical',
          },
        ],
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ metrics: {}, trends: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    expect(screen.getByText('1 Active Alert')).toBeInTheDocument();
  });

  it('should handle refresh button click', async () => {
    const mockAnalyticsData = {
      metrics: {
        totalUsers: 100,
        newUsers: 10,
        totalContractors: 50,
        verifiedContractors: 40,
        totalEventManagers: 50,
        verificationRate: 80,
      },
      trends: {
        userGrowth: [1, 2, 3, 4, 5, 6, 7],
        verificationTrend: 5,
      },
    };

    const mockHealthData = {
      health: {
        status: 'healthy',
        alerts: [],
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValue({
        ok: true,
        json: async () => mockAnalyticsData,
      })
      .mockResolvedValue({
        ok: true,
        json: async () => mockHealthData,
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should make additional fetch calls
    expect(global.fetch).toHaveBeenCalledTimes(4); // 2 initial + 2 on refresh
  });

  it('should display quick action buttons', async () => {
    const mockAnalyticsData = {
      metrics: {
        totalUsers: 100,
        newUsers: 10,
        totalContractors: 50,
        verifiedContractors: 40,
        totalEventManagers: 50,
        verificationRate: 80,
      },
      trends: {
        userGrowth: [1, 2, 3, 4, 5, 6, 7],
        verificationTrend: 5,
      },
    };

    const mockHealthData = {
      health: {
        status: 'healthy',
        alerts: [],
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    expect(screen.getByText('Review Verifications')).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    expect(screen.getByText('Generate Reports')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('should display recent activity section', async () => {
    const mockAnalyticsData = {
      metrics: {
        totalUsers: 100,
        newUsers: 10,
        totalContractors: 50,
        verifiedContractors: 40,
        totalEventManagers: 50,
        verificationRate: 80,
      },
      trends: {
        userGrowth: [1, 2, 3, 4, 5, 6, 7],
        verificationTrend: 5,
      },
    };

    const mockHealthData = {
      health: {
        status: 'healthy',
        alerts: [],
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    expect(
      screen.getByText('System health check completed')
    ).toBeInTheDocument();
    expect(screen.getByText('New contractor registration')).toBeInTheDocument();
    expect(screen.getByText('Verification queue updated')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    // Should still show loading state when API fails
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('should format numbers with locale string', async () => {
    const mockAnalyticsData = {
      metrics: {
        totalUsers: 1000,
        newUsers: 100,
        totalContractors: 500,
        verifiedContractors: 400,
        totalEventManagers: 500,
        verificationRate: 80,
      },
      trends: {
        userGrowth: [1, 2, 3, 4, 5, 6, 7],
        verificationTrend: 5,
      },
    };

    const mockHealthData = {
      health: {
        status: 'healthy',
        alerts: [],
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument(); // Total Users
    });
  });
});
