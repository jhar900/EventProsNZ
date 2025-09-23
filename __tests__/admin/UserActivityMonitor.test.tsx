import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserActivityMonitor from '@/components/features/admin/UserActivityMonitor';
import { useAdmin } from '@/hooks/useAdmin';

// Mock the useAdmin hook
jest.mock('@/hooks/useAdmin');
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/admin/activity',
  }),
}));

describe('UserActivityMonitor', () => {
  const mockFetchUserActivity = jest.fn();
  const mockExportReport = jest.fn();

  beforeEach(() => {
    mockUseAdmin.mockReturnValue({
      fetchUserActivity: mockFetchUserActivity,
      exportReport: mockExportReport,
      loading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with header', () => {
    mockFetchUserActivity.mockResolvedValue({
      activities: [],
      suspiciousActivities: [],
      summary: null,
    });

    render(<UserActivityMonitor />);

    expect(screen.getByText('User Activity Monitor')).toBeInTheDocument();
    expect(
      screen.getByText('Monitor user activities and detect suspicious behavior')
    ).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseAdmin.mockReturnValue({
      fetchUserActivity: mockFetchUserActivity,
      exportReport: mockExportReport,
      loading: true,
      error: null,
    } as any);

    render(<UserActivityMonitor />);

    expect(screen.getByText('Loading activity data...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseAdmin.mockReturnValue({
      fetchUserActivity: mockFetchUserActivity,
      exportReport: mockExportReport,
      loading: false,
      error: 'Failed to load data',
    } as any);

    render(<UserActivityMonitor />);

    expect(screen.getByText('Error: Failed to load data')).toBeInTheDocument();
  });

  it('displays summary cards when data is available', async () => {
    const mockData = {
      activities: [],
      suspiciousActivities: [],
      summary: {
        totalActivities: 150,
        activeUsers: 25,
        suspiciousActivities: 3,
        uniqueIPs: 45,
      },
    };

    mockFetchUserActivity.mockResolvedValue(mockData);

    render(<UserActivityMonitor />);

    await waitFor(() => {
      expect(screen.getByText('Total Activities')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Suspicious Activities')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('displays suspicious activities alert when present', async () => {
    const mockData = {
      activities: [],
      suspiciousActivities: [
        {
          type: 'unusual_login',
          description: 'Login from unusual location',
          created_at: new Date().toISOString(),
        },
      ],
      summary: null,
    };

    mockFetchUserActivity.mockResolvedValue(mockData);

    render(<UserActivityMonitor />);

    await waitFor(() => {
      expect(
        screen.getByText('Suspicious Activities Detected')
      ).toBeInTheDocument();
      expect(
        screen.getByText('1 suspicious activities require immediate attention')
      ).toBeInTheDocument();
    });
  });

  it('displays activity table with data', async () => {
    const mockActivities = [
      {
        id: '1',
        user_id: 'user1',
        activity_type: 'login',
        activity_data: { description: 'User login' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        created_at: new Date().toISOString(),
        users: {
          id: 'user1',
          email: 'test@example.com',
          role: 'contractor',
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      },
    ];

    const mockData = {
      activities: mockActivities,
      suspiciousActivities: [],
      summary: null,
    };

    mockFetchUserActivity.mockResolvedValue(mockData);

    render(<UserActivityMonitor />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('login')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });
  });

  it('filters activities by search term', async () => {
    const mockActivities = [
      {
        id: '1',
        user_id: 'user1',
        activity_type: 'login',
        activity_data: { description: 'User login' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        created_at: new Date().toISOString(),
        users: {
          id: 'user1',
          email: 'test@example.com',
          role: 'contractor',
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
          },
        },
      },
    ];

    const mockData = {
      activities: mockActivities,
      suspiciousActivities: [],
      summary: null,
    };

    mockFetchUserActivity.mockResolvedValue(mockData);

    render(<UserActivityMonitor />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'Search users, activities...'
    );
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('handles export functionality', async () => {
    const mockData = {
      activities: [],
      suspiciousActivities: [],
      summary: null,
    };

    mockFetchUserActivity.mockResolvedValue(mockData);
    mockExportReport.mockResolvedValue(
      new Blob(['test data'], { type: 'text/csv' })
    );

    // Mock URL.createObjectURL and document.createElement
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();

    global.document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    })) as any;
    global.document.body.appendChild = mockAppendChild;
    global.document.body.removeChild = mockRemoveChild;

    render(<UserActivityMonitor />);

    await waitFor(() => {
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockExportReport).toHaveBeenCalledWith('user_activity', 'csv');
    });
  });

  it('filters by activity type', async () => {
    const mockData = {
      activities: [],
      suspiciousActivities: [],
      summary: null,
    };

    mockFetchUserActivity.mockResolvedValue(mockData);

    render(<UserActivityMonitor />);

    await waitFor(() => {
      expect(screen.getByText('Activity Type')).toBeInTheDocument();
    });

    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.click(typeSelect);

    await waitFor(() => {
      expect(mockFetchUserActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: undefined,
        })
      );
    });
  });

  it('handles refresh functionality', async () => {
    const mockData = {
      activities: [],
      suspiciousActivities: [],
      summary: null,
    };

    mockFetchUserActivity.mockResolvedValue(mockData);

    render(<UserActivityMonitor />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockFetchUserActivity).toHaveBeenCalledTimes(2); // Initial load + refresh
  });
});
