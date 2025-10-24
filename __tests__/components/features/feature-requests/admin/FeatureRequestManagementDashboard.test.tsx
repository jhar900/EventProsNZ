import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeatureRequestManagementDashboard from '@/components/features/feature-requests/admin/FeatureRequestManagementDashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockRequests = [
  {
    id: '1',
    title: 'Test Feature Request 1',
    description: 'This is a test feature request',
    status: 'submitted',
    priority: 'high',
    vote_count: 10,
    view_count: 50,
    comments_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    category: {
      name: 'UI/UX',
      color: '#3B82F6',
    },
    tags: [{ name: 'frontend' }, { name: 'ui' }],
    author: {
      first_name: 'John',
      last_name: 'Doe',
      avatar_url: null,
    },
  },
  {
    id: '2',
    title: 'Test Feature Request 2',
    description: 'This is another test feature request',
    status: 'under_review',
    priority: 'medium',
    vote_count: 5,
    view_count: 25,
    comments_count: 2,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    category: {
      name: 'Backend',
      color: '#10B981',
    },
    tags: [{ name: 'backend' }, { name: 'api' }],
    author: {
      first_name: 'Jane',
      last_name: 'Smith',
      avatar_url: null,
    },
  },
];

const mockStats = {
  total: 2,
  pending: 1,
  in_progress: 1,
  completed: 0,
  rejected: 0,
};

describe('FeatureRequestManagementDashboard', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the dashboard with stats overview', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('displays feature requests in a table', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Feature Request 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature Request 2')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    const searchInput = screen.getByPlaceholderText('Search requests...');
    fireEvent.change(searchInput, {
      target: { value: 'Test Feature Request 1' },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Test Feature Request 1')
      );
    });
  });

  it('handles status filtering', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    const statusFilter = screen.getByDisplayValue('All Statuses');
    fireEvent.click(statusFilter);

    await waitFor(() => {
      expect(screen.getByText('Submitted')).toBeInTheDocument();
    });
  });

  it('handles priority filtering', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    const priorityFilter = screen.getByDisplayValue('All Priorities');
    fireEvent.click(priorityFilter);

    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  it('handles bulk selection', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Select all checkbox
    });

    await waitFor(() => {
      expect(screen.getByText('2 request(s) selected')).toBeInTheDocument();
    });
  });

  it('handles individual request selection', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first request
    });

    await waitFor(() => {
      expect(screen.getByText('1 request(s) selected')).toBeInTheDocument();
    });
  });

  it('handles bulk actions', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<FeatureRequestManagementDashboard />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Select all
    });

    await waitFor(() => {
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/feature-requests/bulk',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"action":"approve"'),
        })
      );
    });
  });

  it('handles status updates', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<FeatureRequestManagementDashboard />);

    await waitFor(() => {
      const moreButton = screen
        .getAllByRole('button')
        .find(button =>
          button.querySelector('svg[data-lucide="more-horizontal"]')
        );
      if (moreButton) {
        fireEvent.click(moreButton);
      }
    });

    await waitFor(() => {
      const markAsPlannedButton = screen.getByText('Mark as Planned');
      fireEvent.click(markAsPlannedButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/feature-requests/1/status'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"status":"planned"'),
        })
      );
    });
  });

  it('displays error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<FeatureRequestManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<FeatureRequestManagementDashboard />);

    expect(
      screen.getByRole('progressbar', { hidden: true })
    ).toBeInTheDocument();
  });

  it('handles pagination', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: mockRequests,
          totalPages: 2,
          pagination: { page: 1, totalPages: 2 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });
  });

  it('displays request details correctly', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Test Feature Request 1')).toBeInTheDocument();
      expect(
        screen.getByText('This is a test feature request')
      ).toBeInTheDocument();
      expect(screen.getByText('UI/UX')).toBeInTheDocument();
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('ui')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // vote count
      expect(screen.getByText('50')).toBeInTheDocument(); // view count
    });
  });

  it('handles sorting functionality', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests, totalPages: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ overview: mockStats }),
      });

    render(<FeatureRequestManagementDashboard />);

    const sortSelect = screen.getByDisplayValue('Created Date');
    fireEvent.click(sortSelect);

    await waitFor(() => {
      expect(screen.getByText('Votes')).toBeInTheDocument();
    });
  });
});
