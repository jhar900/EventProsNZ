import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SystemHealthMonitor from '@/components/features/admin/SystemHealthMonitor';
import { useAdmin } from '@/hooks/useAdmin';

// Mock the useAdmin hook
jest.mock('@/hooks/useAdmin');
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

describe('SystemHealthMonitor', () => {
  const mockFetchSystemHealth = jest.fn();
  const mockFetchSystemPerformance = jest.fn();

  beforeEach(() => {
    mockUseAdmin.mockReturnValue({
      fetchSystemHealth: mockFetchSystemHealth,
      fetchSystemPerformance: mockFetchSystemPerformance,
      loading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with header', () => {
    mockFetchSystemHealth.mockResolvedValue({
      health: {
        status: 'healthy',
        database: { status: 'connected', responseTime: 50 },
        metrics: {
          totalUsers: 100,
          activeUsers: 10,
          totalContractors: 50,
          pendingVerifications: 5,
        },
        alerts: [],
        recentErrors: [],
        timestamp: new Date().toISOString(),
      },
    });

    mockFetchSystemPerformance.mockResolvedValue({
      performance: {
        cpu: { usage: 45, cores: 4, load: [0.5, 0.3, 0.2] },
        memory: {
          used: 1024 * 1024 * 1024,
          total: 4 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024,
          total: 200 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        network: {
          bytesIn: 1024 * 1024,
          bytesOut: 512 * 1024,
          connections: 25,
        },
        uptime: 86400,
        timestamp: new Date().toISOString(),
      },
    });

    render(<SystemHealthMonitor />);

    expect(screen.getByText('System Health Monitor')).toBeInTheDocument();
    expect(
      screen.getByText('Monitor system performance and health metrics')
    ).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseAdmin.mockReturnValue({
      fetchSystemHealth: mockFetchSystemHealth,
      fetchSystemPerformance: mockFetchSystemPerformance,
      loading: true,
      error: null,
    } as any);

    render(<SystemHealthMonitor />);

    expect(
      screen.getByText('Loading system health data...')
    ).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseAdmin.mockReturnValue({
      fetchSystemHealth: mockFetchSystemHealth,
      fetchSystemPerformance: mockFetchSystemPerformance,
      loading: false,
      error: 'Failed to load system data',
    } as any);

    render(<SystemHealthMonitor />);

    expect(
      screen.getByText('Error: Failed to load system data')
    ).toBeInTheDocument();
  });

  it('displays system status overview when data is available', async () => {
    const mockHealthData = {
      health: {
        status: 'healthy',
        database: { status: 'connected', responseTime: 50 },
        metrics: {
          totalUsers: 100,
          activeUsers: 10,
          totalContractors: 50,
          pendingVerifications: 5,
        },
        alerts: [],
        recentErrors: [],
        timestamp: new Date().toISOString(),
      },
    };

    const mockPerformanceData = {
      performance: {
        cpu: { usage: 45, cores: 4, load: [0.5, 0.3, 0.2] },
        memory: {
          used: 1024 * 1024 * 1024,
          total: 4 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024,
          total: 200 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        network: {
          bytesIn: 1024 * 1024,
          bytesOut: 512 * 1024,
          connections: 25,
        },
        uptime: 86400,
        timestamp: new Date().toISOString(),
      },
    };

    mockFetchSystemHealth.mockResolvedValue(mockHealthData);
    mockFetchSystemPerformance.mockResolvedValue(mockPerformanceData);

    render(<SystemHealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('50ms')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('displays performance metrics when data is available', async () => {
    const mockHealthData = {
      health: {
        status: 'healthy',
        database: { status: 'connected', responseTime: 50 },
        metrics: {
          totalUsers: 100,
          activeUsers: 10,
          totalContractors: 50,
          pendingVerifications: 5,
        },
        alerts: [],
        recentErrors: [],
        timestamp: new Date().toISOString(),
      },
    };

    const mockPerformanceData = {
      performance: {
        cpu: { usage: 45, cores: 4, load: [0.5, 0.3, 0.2] },
        memory: {
          used: 1024 * 1024 * 1024,
          total: 4 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024,
          total: 200 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        network: {
          bytesIn: 1024 * 1024,
          bytesOut: 512 * 1024,
          connections: 25,
        },
        uptime: 86400,
        timestamp: new Date().toISOString(),
      },
    };

    mockFetchSystemHealth.mockResolvedValue(mockHealthData);
    mockFetchSystemPerformance.mockResolvedValue(mockPerformanceData);

    render(<SystemHealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText('CPU Usage')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('Network & Uptime')).toBeInTheDocument();
    });
  });

  it('displays recent errors when present', async () => {
    const mockHealthData = {
      health: {
        status: 'degraded',
        database: { status: 'connected', responseTime: 50 },
        metrics: {
          totalUsers: 100,
          activeUsers: 10,
          totalContractors: 50,
          pendingVerifications: 5,
        },
        alerts: [],
        recentErrors: [
          {
            message: 'Database connection timeout',
            type: 'database',
            severity: 'high',
            timestamp: new Date().toISOString(),
          },
        ],
        timestamp: new Date().toISOString(),
      },
    };

    const mockPerformanceData = {
      performance: {
        cpu: { usage: 45, cores: 4, load: [0.5, 0.3, 0.2] },
        memory: {
          used: 1024 * 1024 * 1024,
          total: 4 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024,
          total: 200 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        network: {
          bytesIn: 1024 * 1024,
          bytesOut: 512 * 1024,
          connections: 25,
        },
        uptime: 86400,
        timestamp: new Date().toISOString(),
      },
    };

    mockFetchSystemHealth.mockResolvedValue(mockHealthData);
    mockFetchSystemPerformance.mockResolvedValue(mockPerformanceData);

    render(<SystemHealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText('Recent Errors')).toBeInTheDocument();
      expect(
        screen.getByText('Database connection timeout')
      ).toBeInTheDocument();
      expect(screen.getByText('database')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });

  it('displays system metrics summary', async () => {
    const mockHealthData = {
      health: {
        status: 'healthy',
        database: { status: 'connected', responseTime: 50 },
        metrics: {
          totalUsers: 100,
          activeUsers: 10,
          totalContractors: 50,
          pendingVerifications: 5,
        },
        alerts: [],
        recentErrors: [],
        timestamp: new Date().toISOString(),
      },
    };

    const mockPerformanceData = {
      performance: {
        cpu: { usage: 45, cores: 4, load: [0.5, 0.3, 0.2] },
        memory: {
          used: 1024 * 1024 * 1024,
          total: 4 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024,
          total: 200 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        network: {
          bytesIn: 1024 * 1024,
          bytesOut: 512 * 1024,
          connections: 25,
        },
        uptime: 86400,
        timestamp: new Date().toISOString(),
      },
    };

    mockFetchSystemHealth.mockResolvedValue(mockHealthData);
    mockFetchSystemPerformance.mockResolvedValue(mockPerformanceData);

    render(<SystemHealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText('System Metrics')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Contractors')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('Pending Verifications')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('handles refresh functionality', async () => {
    const mockHealthData = {
      health: {
        status: 'healthy',
        database: { status: 'connected', responseTime: 50 },
        metrics: {
          totalUsers: 100,
          activeUsers: 10,
          totalContractors: 50,
          pendingVerifications: 5,
        },
        alerts: [],
        recentErrors: [],
        timestamp: new Date().toISOString(),
      },
    };

    const mockPerformanceData = {
      performance: {
        cpu: { usage: 45, cores: 4, load: [0.5, 0.3, 0.2] },
        memory: {
          used: 1024 * 1024 * 1024,
          total: 4 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024,
          total: 200 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        network: {
          bytesIn: 1024 * 1024,
          bytesOut: 512 * 1024,
          connections: 25,
        },
        uptime: 86400,
        timestamp: new Date().toISOString(),
      },
    };

    mockFetchSystemHealth.mockResolvedValue(mockHealthData);
    mockFetchSystemPerformance.mockResolvedValue(mockPerformanceData);

    render(<SystemHealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockFetchSystemHealth).toHaveBeenCalledTimes(2); // Initial load + refresh
    expect(mockFetchSystemPerformance).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  it('displays degraded status correctly', async () => {
    const mockHealthData = {
      health: {
        status: 'degraded',
        database: { status: 'connected', responseTime: 50 },
        metrics: {
          totalUsers: 100,
          activeUsers: 10,
          totalContractors: 50,
          pendingVerifications: 5,
        },
        alerts: [],
        recentErrors: [],
        timestamp: new Date().toISOString(),
      },
    };

    const mockPerformanceData = {
      performance: {
        cpu: { usage: 45, cores: 4, load: [0.5, 0.3, 0.2] },
        memory: {
          used: 1024 * 1024 * 1024,
          total: 4 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024,
          total: 200 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        network: {
          bytesIn: 1024 * 1024,
          bytesOut: 512 * 1024,
          connections: 25,
        },
        uptime: 86400,
        timestamp: new Date().toISOString(),
      },
    };

    mockFetchSystemHealth.mockResolvedValue(mockHealthData);
    mockFetchSystemPerformance.mockResolvedValue(mockPerformanceData);

    render(<SystemHealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText('Degraded')).toBeInTheDocument();
    });
  });

  it('displays critical status correctly', async () => {
    const mockHealthData = {
      health: {
        status: 'critical',
        database: { status: 'connected', responseTime: 50 },
        metrics: {
          totalUsers: 100,
          activeUsers: 10,
          totalContractors: 50,
          pendingVerifications: 5,
        },
        alerts: [],
        recentErrors: [],
        timestamp: new Date().toISOString(),
      },
    };

    const mockPerformanceData = {
      performance: {
        cpu: { usage: 45, cores: 4, load: [0.5, 0.3, 0.2] },
        memory: {
          used: 1024 * 1024 * 1024,
          total: 4 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        disk: {
          used: 50 * 1024 * 1024 * 1024,
          total: 200 * 1024 * 1024 * 1024,
          percentage: 25,
        },
        network: {
          bytesIn: 1024 * 1024,
          bytesOut: 512 * 1024,
          connections: 25,
        },
        uptime: 86400,
        timestamp: new Date().toISOString(),
      },
    };

    mockFetchSystemHealth.mockResolvedValue(mockHealthData);
    mockFetchSystemPerformance.mockResolvedValue(mockPerformanceData);

    render(<SystemHealthMonitor />);

    await waitFor(() => {
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });
  });
});
