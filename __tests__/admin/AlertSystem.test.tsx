import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertSystem from '@/components/features/admin/AlertSystem';
import { useAdmin } from '@/hooks/useAdmin';

// Mock the useAdmin hook
jest.mock('@/hooks/useAdmin');
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

describe('AlertSystem', () => {
  const mockFetchAlerts = jest.fn();
  const mockResolveAlert = jest.fn();
  const mockDismissAlert = jest.fn();
  const mockCreateAlert = jest.fn();

  beforeEach(() => {
    mockUseAdmin.mockReturnValue({
      fetchAlerts: mockFetchAlerts,
      resolveAlert: mockResolveAlert,
      dismissAlert: mockDismissAlert,
      createAlert: mockCreateAlert,
      loading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with header', () => {
    mockFetchAlerts.mockResolvedValue({
      alerts: [],
      summary: null,
    });

    render(<AlertSystem />);

    expect(screen.getByText('Alert System')).toBeInTheDocument();
    expect(
      screen.getByText('Monitor and manage system alerts and notifications')
    ).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseAdmin.mockReturnValue({
      fetchAlerts: mockFetchAlerts,
      resolveAlert: mockResolveAlert,
      dismissAlert: mockDismissAlert,
      createAlert: mockCreateAlert,
      loading: true,
      error: null,
    } as any);

    render(<AlertSystem />);

    expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseAdmin.mockReturnValue({
      fetchAlerts: mockFetchAlerts,
      resolveAlert: mockResolveAlert,
      dismissAlert: mockDismissAlert,
      createAlert: mockCreateAlert,
      loading: false,
      error: 'Failed to load alerts',
    } as any);

    render(<AlertSystem />);

    expect(
      screen.getByText('Error: Failed to load alerts')
    ).toBeInTheDocument();
  });

  it('displays summary cards when data is available', async () => {
    const mockData = {
      alerts: [],
      summary: {
        totalAlerts: 25,
        activeAlerts: 8,
        criticalAlerts: 2,
        resolvedToday: 5,
      },
    };

    mockFetchAlerts.mockResolvedValue(mockData);

    render(<AlertSystem />);

    await waitFor(() => {
      expect(screen.getByText('Total Alerts')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Resolved Today')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('displays alerts table with data', async () => {
    const mockAlerts = [
      {
        id: '1',
        alert_type: 'security',
        severity: 'high',
        message: 'Suspicious login attempt detected',
        details: { ip: '192.168.1.100', user: 'test@example.com' },
        is_resolved: false,
        created_at: new Date().toISOString(),
      },
    ];

    const mockData = {
      alerts: mockAlerts,
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);

    render(<AlertSystem />);

    await waitFor(() => {
      expect(
        screen.getByText('Suspicious login attempt detected')
      ).toBeInTheDocument();
      expect(screen.getByText('security')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('filters alerts by search term', async () => {
    const mockAlerts = [
      {
        id: '1',
        alert_type: 'security',
        severity: 'high',
        message: 'Suspicious login attempt detected',
        details: { ip: '192.168.1.100', user: 'test@example.com' },
        is_resolved: false,
        created_at: new Date().toISOString(),
      },
    ];

    const mockData = {
      alerts: mockAlerts,
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);

    render(<AlertSystem />);

    await waitFor(() => {
      expect(
        screen.getByText('Suspicious login attempt detected')
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search alerts...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(
        screen.queryByText('Suspicious login attempt detected')
      ).not.toBeInTheDocument();
    });
  });

  it('filters by severity', async () => {
    const mockData = {
      alerts: [],
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);

    render(<AlertSystem />);

    await waitFor(() => {
      expect(screen.getByText('Severity')).toBeInTheDocument();
    });

    const severitySelect = screen.getByDisplayValue('All Severities');
    fireEvent.click(severitySelect);

    await waitFor(() => {
      expect(mockFetchAlerts).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: undefined,
        })
      );
    });
  });

  it('opens create alert dialog when Create Alert button is clicked', async () => {
    const mockData = {
      alerts: [],
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);

    render(<AlertSystem />);

    await waitFor(() => {
      expect(screen.getByText('Create Alert')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Alert');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Alert')).toBeInTheDocument();
      expect(screen.getByText('Alert Type')).toBeInTheDocument();
      expect(screen.getByText('Severity')).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeInTheDocument();
    });
  });

  it('creates a new alert', async () => {
    const mockData = {
      alerts: [],
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);
    mockCreateAlert.mockResolvedValue({ alert: { id: 'new-alert' } });

    render(<AlertSystem />);

    await waitFor(() => {
      expect(screen.getByText('Create Alert')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Alert');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Alert')).toBeInTheDocument();
    });

    const alertTypeInput = screen.getByPlaceholderText(
      'e.g., security, performance, system'
    );
    fireEvent.change(alertTypeInput, { target: { value: 'security' } });

    const messageInput = screen.getByPlaceholderText('Alert message');
    fireEvent.change(messageInput, { target: { value: 'Test alert message' } });

    const createAlertButton = screen.getByText('Create Alert');
    fireEvent.click(createAlertButton);

    await waitFor(() => {
      expect(mockCreateAlert).toHaveBeenCalledWith(
        'security',
        'medium',
        'Test alert message',
        undefined
      );
    });
  });

  it('opens alert details dialog when View button is clicked', async () => {
    const mockAlerts = [
      {
        id: '1',
        alert_type: 'security',
        severity: 'high',
        message: 'Suspicious login attempt detected',
        details: { ip: '192.168.1.100', user: 'test@example.com' },
        is_resolved: false,
        created_at: new Date().toISOString(),
      },
    ];

    const mockData = {
      alerts: mockAlerts,
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);

    render(<AlertSystem />);

    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
    });

    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Alert Details')).toBeInTheDocument();
      expect(
        screen.getByText('Suspicious login attempt detected')
      ).toBeInTheDocument();
      expect(screen.getByText('security')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });

  it('resolves an alert with resolution notes', async () => {
    const mockAlerts = [
      {
        id: '1',
        alert_type: 'security',
        severity: 'high',
        message: 'Suspicious login attempt detected',
        details: { ip: '192.168.1.100', user: 'test@example.com' },
        is_resolved: false,
        created_at: new Date().toISOString(),
      },
    ];

    const mockData = {
      alerts: mockAlerts,
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);
    mockResolveAlert.mockResolvedValue({ success: true });

    render(<AlertSystem />);

    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
    });

    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Resolution Notes')).toBeInTheDocument();
    });

    const resolutionTextarea = screen.getByPlaceholderText(
      'Enter resolution details...'
    );
    fireEvent.change(resolutionTextarea, {
      target: { value: 'Alert resolved - false positive' },
    });

    const resolveButton = screen.getByText('Resolve');
    fireEvent.click(resolveButton);

    await waitFor(() => {
      expect(mockResolveAlert).toHaveBeenCalledWith(
        '1',
        'Alert resolved - false positive'
      );
    });
  });

  it('dismisses an alert', async () => {
    const mockAlerts = [
      {
        id: '1',
        alert_type: 'security',
        severity: 'high',
        message: 'Suspicious login attempt detected',
        details: { ip: '192.168.1.100', user: 'test@example.com' },
        is_resolved: false,
        created_at: new Date().toISOString(),
      },
    ];

    const mockData = {
      alerts: mockAlerts,
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);
    mockDismissAlert.mockResolvedValue({ success: true });

    render(<AlertSystem />);

    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
    });

    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(screen.getByText('Dismiss')).toBeInTheDocument();
    });

    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(mockDismissAlert).toHaveBeenCalledWith('1');
    });
  });

  it('handles refresh functionality', async () => {
    const mockData = {
      alerts: [],
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);

    render(<AlertSystem />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockFetchAlerts).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  it('filters by status (active vs all)', async () => {
    const mockData = {
      alerts: [],
      summary: null,
    };

    mockFetchAlerts.mockResolvedValue(mockData);

    render(<AlertSystem />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('Active Only');
    fireEvent.click(statusSelect);

    await waitFor(() => {
      expect(mockFetchAlerts).toHaveBeenCalledWith(
        expect.objectContaining({
          resolved: false,
        })
      );
    });
  });
});
