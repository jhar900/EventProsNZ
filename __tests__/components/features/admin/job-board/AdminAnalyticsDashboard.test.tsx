import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminAnalyticsDashboard from '@/components/features/admin/AdminAnalyticsDashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Line: () => <div />,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Area: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Pie: () => <div />,
  Cell: () => <div />,
}));

const mockAnalyticsData = {
  overview: {
    totalJobs: 150,
    activeJobs: 120,
    totalApplications: 450,
    conversionRate: 15.5,
    averageTimeToFill: 12,
    userSatisfaction: 4.2,
    totalRevenue: 125000,
    geographicDistribution: [
      { location: 'Auckland', jobs: 50, applications: 150 },
      { location: 'Wellington', jobs: 30, applications: 90 },
      { location: 'Christchurch', jobs: 25, applications: 75 },
    ],
  },
  trends: {
    jobPostings: [
      { date: '2024-01-01', count: 10 },
      { date: '2024-01-02', count: 15 },
      { date: '2024-01-03', count: 12 },
    ],
    applications: [
      { date: '2024-01-01', count: 30 },
      { date: '2024-01-02', count: 45 },
      { date: '2024-01-03', count: 36 },
    ],
    conversions: [
      { date: '2024-01-01', rate: 15.0 },
      { date: '2024-01-02', rate: 18.5 },
      { date: '2024-01-03', rate: 16.2 },
    ],
    satisfaction: [
      { date: '2024-01-01', rating: 4.1 },
      { date: '2024-01-02', rating: 4.3 },
      { date: '2024-01-03', rating: 4.2 },
    ],
  },
  categories: [
    {
      name: 'catering',
      jobs: 40,
      applications: 120,
      conversionRate: 12.5,
      averageBudget: 1500,
    },
    {
      name: 'photography',
      jobs: 35,
      applications: 105,
      conversionRate: 15.0,
      averageBudget: 2000,
    },
  ],
  performance: {
    topPerformingJobs: [
      {
        id: '1',
        title: 'Wedding Photography',
        applications: 25,
        views: 100,
        conversionRate: 25.0,
      },
    ],
    userEngagement: {
      averageSessionTime: 1800,
      pageViews: 5000,
      bounceRate: 35.5,
    },
  },
};

describe('AdminAnalyticsDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsData,
    });

    render(<AdminAnalyticsDashboard />);

    expect(
      screen.getByText('Loading analytics dashboard...')
    ).toBeInTheDocument();
  });

  it('renders analytics dashboard after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsData,
    });

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Board Analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('150')).toBeInTheDocument(); // Total Jobs
    expect(screen.getByText('450')).toBeInTheDocument(); // Applications
    expect(screen.getByText('12 days')).toBeInTheDocument(); // Time to Fill
    expect(screen.getByText('4.2/5')).toBeInTheDocument(); // User Satisfaction
  });

  it('changes time range and reloads data', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      });

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Board Analytics')).toBeInTheDocument();
    });

    // Change time range
    const timeRangeSelect = screen.getByDisplayValue('Last 30 days');
    fireEvent.click(timeRangeSelect);
    fireEvent.click(screen.getByText('Last 90 days'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/jobs/analytics?period=90d'
      );
    });
  });

  it('exports report when export button is clicked', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['test'], { type: 'application/pdf' }),
      });

    // Mock URL.createObjectURL and document.createElement
    const mockUrl = 'blob:test-url';
    global.URL.createObjectURL = jest.fn(() => mockUrl);
    global.URL.revokeObjectURL = jest.fn();

    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockReturnValue(mockAnchor as any);
    const appendChildSpy = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation();
    const removeChildSpy = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation();

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Board Analytics')).toBeInTheDocument();
    });

    // Click export button
    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/jobs/reports?format=pdf');
    });

    // Cleanup
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('switches between analytics tabs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsData,
    });

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Board Analytics')).toBeInTheDocument();
    });

    // Switch to trends tab
    fireEvent.click(screen.getByText('Trends'));

    await waitFor(() => {
      expect(screen.getByText('Conversion Rate Trends')).toBeInTheDocument();
    });

    // Switch to categories tab
    fireEvent.click(screen.getByText('Categories'));

    await waitFor(() => {
      expect(screen.getByText('Category Performance')).toBeInTheDocument();
    });
  });

  it('displays geographic distribution data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsData,
    });

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Board Analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('Auckland')).toBeInTheDocument();
    expect(screen.getByText('Wellington')).toBeInTheDocument();
    expect(screen.getByText('Christchurch')).toBeInTheDocument();
  });

  it('displays category performance data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsData,
    });

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Board Analytics')).toBeInTheDocument();
    });

    // Switch to categories tab
    fireEvent.click(screen.getByText('Categories'));

    await waitFor(() => {
      expect(screen.getByText('catering')).toBeInTheDocument();
      expect(screen.getByText('photography')).toBeInTheDocument();
    });
  });

  it('displays top performing jobs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsData,
    });

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Board Analytics')).toBeInTheDocument();
    });

    // Switch to performance tab
    fireEvent.click(screen.getByText('Performance'));

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('No analytics data available')
      ).toBeInTheDocument();
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      });

    render(<AdminAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Board Analytics')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
