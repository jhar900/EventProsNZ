import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentModeration from '@/components/features/admin/ContentModeration';
import { useAdmin } from '@/hooks/useAdmin';

// Mock the useAdmin hook
jest.mock('@/hooks/useAdmin');
const mockUseAdmin = useAdmin as jest.MockedFunction<typeof useAdmin>;

describe('ContentModeration', () => {
  const mockFetchContentReports = jest.fn();
  const mockModerateContent = jest.fn();

  beforeEach(() => {
    mockUseAdmin.mockReturnValue({
      fetchContentReports: mockFetchContentReports,
      moderateContent: mockModerateContent,
      loading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with header', () => {
    mockFetchContentReports.mockResolvedValue({
      reports: [],
      summary: null,
    });

    render(<ContentModeration />);

    expect(screen.getByText('Content Moderation')).toBeInTheDocument();
    expect(
      screen.getByText('Review and moderate reported content')
    ).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseAdmin.mockReturnValue({
      fetchContentReports: mockFetchContentReports,
      moderateContent: mockModerateContent,
      loading: true,
      error: null,
    } as any);

    render(<ContentModeration />);

    expect(screen.getByText('Loading content reports...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseAdmin.mockReturnValue({
      fetchContentReports: mockFetchContentReports,
      moderateContent: mockModerateContent,
      loading: false,
      error: 'Failed to load reports',
    } as any);

    render(<ContentModeration />);

    expect(
      screen.getByText('Error: Failed to load reports')
    ).toBeInTheDocument();
  });

  it('displays summary cards when data is available', async () => {
    const mockData = {
      reports: [],
      summary: {
        totalReports: 25,
        pendingReports: 8,
        approvedReports: 12,
        rejectedReports: 5,
      },
    };

    mockFetchContentReports.mockResolvedValue(mockData);

    render(<ContentModeration />);

    await waitFor(() => {
      expect(screen.getByText('Total Reports')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('displays content reports table with data', async () => {
    const mockReports = [
      {
        id: '1',
        content_type: 'profile',
        content_id: 'content1',
        reported_by: 'user1',
        reason: 'inappropriate',
        description: 'Inappropriate content',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users: {
          id: 'user1',
          email: 'reporter@example.com',
          profiles: {
            first_name: 'Jane',
            last_name: 'Smith',
          },
        },
      },
    ];

    const mockData = {
      reports: mockReports,
      summary: null,
    };

    mockFetchContentReports.mockResolvedValue(mockData);

    render(<ContentModeration />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('reporter@example.com')).toBeInTheDocument();
      expect(screen.getByText('profile')).toBeInTheDocument();
      expect(screen.getByText('inappropriate')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });

  it('filters reports by search term', async () => {
    const mockReports = [
      {
        id: '1',
        content_type: 'profile',
        content_id: 'content1',
        reported_by: 'user1',
        reason: 'inappropriate',
        description: 'Inappropriate content',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users: {
          id: 'user1',
          email: 'reporter@example.com',
          profiles: {
            first_name: 'Jane',
            last_name: 'Smith',
          },
        },
      },
    ];

    const mockData = {
      reports: mockReports,
      summary: null,
    };

    mockFetchContentReports.mockResolvedValue(mockData);

    render(<ContentModeration />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search reports...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    const mockData = {
      reports: [],
      summary: null,
    };

    mockFetchContentReports.mockResolvedValue(mockData);

    render(<ContentModeration />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('All Statuses');
    fireEvent.click(statusSelect);

    await waitFor(() => {
      expect(mockFetchContentReports).toHaveBeenCalledWith(
        expect.objectContaining({
          status: undefined,
        })
      );
    });
  });

  it('filters by content type', async () => {
    const mockData = {
      reports: [],
      summary: null,
    };

    mockFetchContentReports.mockResolvedValue(mockData);

    render(<ContentModeration />);

    await waitFor(() => {
      expect(screen.getByText('Content Type')).toBeInTheDocument();
    });

    const typeSelect = screen.getByDisplayValue('All Types');
    fireEvent.click(typeSelect);

    await waitFor(() => {
      expect(mockFetchContentReports).toHaveBeenCalledWith(
        expect.objectContaining({
          type: undefined,
        })
      );
    });
  });

  it('opens review dialog when Review button is clicked', async () => {
    const mockReports = [
      {
        id: '1',
        content_type: 'profile',
        content_id: 'content1',
        reported_by: 'user1',
        reason: 'inappropriate',
        description: 'Inappropriate content',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users: {
          id: 'user1',
          email: 'reporter@example.com',
          profiles: {
            first_name: 'Jane',
            last_name: 'Smith',
          },
        },
      },
    ];

    const mockData = {
      reports: mockReports,
      summary: null,
    };

    mockFetchContentReports.mockResolvedValue(mockData);

    render(<ContentModeration />);

    await waitFor(() => {
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    const reviewButton = screen.getByText('Review');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Content Report Review')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('reporter@example.com')).toBeInTheDocument();
    });
  });

  it('handles content approval', async () => {
    const mockReports = [
      {
        id: '1',
        content_type: 'profile',
        content_id: 'content1',
        reported_by: 'user1',
        reason: 'inappropriate',
        description: 'Inappropriate content',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users: {
          id: 'user1',
          email: 'reporter@example.com',
          profiles: {
            first_name: 'Jane',
            last_name: 'Smith',
          },
        },
      },
    ];

    const mockData = {
      reports: mockReports,
      summary: null,
    };

    mockFetchContentReports.mockResolvedValue(mockData);
    mockModerateContent.mockResolvedValue({ success: true });

    render(<ContentModeration />);

    await waitFor(() => {
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    const reviewButton = screen.getByText('Review');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Approve Content')).toBeInTheDocument();
    });

    const approveButton = screen.getByText('Approve Content');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockModerateContent).toHaveBeenCalledWith(
        'approve',
        '1',
        '',
        'content1',
        'profile'
      );
    });
  });

  it('handles content rejection with reason', async () => {
    const mockReports = [
      {
        id: '1',
        content_type: 'profile',
        content_id: 'content1',
        reported_by: 'user1',
        reason: 'inappropriate',
        description: 'Inappropriate content',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users: {
          id: 'user1',
          email: 'reporter@example.com',
          profiles: {
            first_name: 'Jane',
            last_name: 'Smith',
          },
        },
      },
    ];

    const mockData = {
      reports: mockReports,
      summary: null,
    };

    mockFetchContentReports.mockResolvedValue(mockData);
    mockModerateContent.mockResolvedValue({ success: true });

    render(<ContentModeration />);

    await waitFor(() => {
      expect(screen.getByText('Review')).toBeInTheDocument();
    });

    const reviewButton = screen.getByText('Review');
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Moderation Reason')).toBeInTheDocument();
    });

    const reasonTextarea = screen.getByPlaceholderText(
      'Enter reason for your decision...'
    );
    fireEvent.change(reasonTextarea, {
      target: { value: 'Content violates guidelines' },
    });

    const rejectButton = screen.getByText('Reject Content');
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockModerateContent).toHaveBeenCalledWith(
        'reject',
        '1',
        'Content violates guidelines',
        'content1',
        'profile'
      );
    });
  });

  it('handles refresh functionality', async () => {
    const mockData = {
      reports: [],
      summary: null,
    };

    mockFetchContentReports.mockResolvedValue(mockData);

    render(<ContentModeration />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockFetchContentReports).toHaveBeenCalledTimes(2); // Initial load + refresh
  });
});
