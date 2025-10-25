import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedAnalyticsDashboard from '@/components/features/admin/analytics/AdvancedAnalyticsDashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock window.innerWidth for mobile detection
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('AdvancedAnalyticsDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders dashboard header', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(
      screen.getByText('Advanced Analytics Dashboard')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Comprehensive platform analytics and insights')
    ).toBeInTheDocument();
  });

  it('renders time range selector', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByDisplayValue('Last 30 days')).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('renders export manager', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('Export Data')).toBeInTheDocument();
  });

  it('renders dashboard customizer', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('Customize Dashboard')).toBeInTheDocument();
  });

  it('renders analytics tabs', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Real-time')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Contractors')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Geographic')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('displays overview tab content by default', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('User Growth')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('displays quick actions in overview', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Export Report')).toBeInTheDocument();
    expect(screen.getByText('Customize')).toBeInTheDocument();
  });

  it('displays system status in overview', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('API Status')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Cache')).toBeInTheDocument();
  });

  it('handles tab switching', async () => {
    render(<AdvancedAnalyticsDashboard />);

    const realtimeTab = screen.getByText('Real-time');
    realtimeTab.click();

    await waitFor(() => {
      expect(screen.getByText('Real-Time Metrics')).toBeInTheDocument();
    });
  });

  it('handles time range changes', async () => {
    render(<AdvancedAnalyticsDashboard />);

    const timeRangeSelect = screen.getByDisplayValue('Last 30 days');
    expect(timeRangeSelect).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    render(<AdvancedAnalyticsDashboard />);

    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();

    refreshButton.click();

    await waitFor(() => {
      expect(screen.getByText('Last updated:')).toBeInTheDocument();
    });
  });

  it('displays last updated timestamp', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('renders date range filter dialog trigger', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });

  it('displays overview metrics correctly', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('12,345')).toBeInTheDocument(); // Total users
    expect(screen.getByText('$45,678')).toBeInTheDocument(); // Revenue
    expect(screen.getByText('1,234')).toBeInTheDocument(); // Events
  });

  it('displays growth indicators', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('+12.5% from last month')).toBeInTheDocument();
    expect(screen.getByText('+8.2% from last month')).toBeInTheDocument();
    expect(screen.getByText('+15.3% from last month')).toBeInTheDocument();
  });

  it('renders mobile view when screen is small', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(<AdvancedAnalyticsDashboard />);

    // Should render mobile interface
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('handles export functionality', () => {
    render(<AdvancedAnalyticsDashboard />);

    const exportButton = screen.getByText('Export Data');
    expect(exportButton).toBeInTheDocument();
  });

  it('handles dashboard customization', () => {
    render(<AdvancedAnalyticsDashboard />);

    const customizeButton = screen.getByText('Customize Dashboard');
    expect(customizeButton).toBeInTheDocument();
  });

  it('displays system health indicators', () => {
    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('renders all tab content components', () => {
    render(<AdvancedAnalyticsDashboard />);

    // Check that all tab triggers are present
    const tabs = [
      'Overview',
      'Real-time',
      'Users',
      'Revenue',
      'Contractors',
      'Events',
      'Geographic',
      'Categories',
    ];

    tabs.forEach(tab => {
      expect(screen.getByText(tab)).toBeInTheDocument();
    });
  });
});
