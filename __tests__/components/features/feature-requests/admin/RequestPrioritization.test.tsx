import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RequestPrioritization from '@/components/features/feature-requests/admin/RequestPrioritization';

// Mock fetch
global.fetch = jest.fn();

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
    title: 'High Priority Feature',
    description: 'This is a high priority feature request',
    status: 'submitted',
    priority: 'high',
    vote_count: 25,
    view_count: 100,
    comments_count: 10,
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
    },
    impact_score: 85,
    effort_score: 60,
    priority_score: 75,
  },
  {
    id: '2',
    title: 'Low Priority Feature',
    description: 'This is a low priority feature request',
    status: 'submitted',
    priority: 'low',
    vote_count: 5,
    view_count: 20,
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
    },
    impact_score: 30,
    effort_score: 80,
    priority_score: 45,
  },
];

describe('RequestPrioritization', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the prioritization interface', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      expect(screen.getByText('Prioritization Criteria')).toBeInTheDocument();
      expect(screen.getByText('Impact Weight')).toBeInTheDocument();
      expect(screen.getByText('Effort Weight')).toBeInTheDocument();
      expect(screen.getByText('Urgency Weight')).toBeInTheDocument();
      expect(screen.getByText('Community Weight')).toBeInTheDocument();
      expect(screen.getByText('Business Weight')).toBeInTheDocument();
    });
  });

  it('displays prioritized requests in order', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      expect(screen.getByText('High Priority Feature')).toBeInTheDocument();
      expect(screen.getByText('Low Priority Feature')).toBeInTheDocument();
    });

    // Check that high priority feature appears first (higher priority score)
    const requestRows = screen.getAllByText(/Priority Feature/);
    expect(requestRows[0]).toHaveTextContent('High Priority Feature');
  });

  it('allows adjusting prioritization criteria', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      const impactSlider = screen.getByLabelText('Impact Weight');
      expect(impactSlider).toHaveValue('30');
    });

    // Test slider interaction
    const impactSlider = screen.getByLabelText('Impact Weight');
    fireEvent.change(impactSlider, { target: { value: '50' } });

    expect(impactSlider).toHaveValue('50');
  });

  it('handles bulk priority updates', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<RequestPrioritization />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Select all
    });

    await waitFor(() => {
      expect(screen.getByText('2 request(s) selected')).toBeInTheDocument();
    });

    // Test bulk priority update
    const prioritySelect = screen.getByDisplayValue('Set Priority');
    fireEvent.click(prioritySelect);

    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  it('handles individual priority updates', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<RequestPrioritization />);

    await waitFor(() => {
      const prioritySelects = screen.getAllByDisplayValue('high');
      fireEvent.click(prioritySelects[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });
  });

  it('displays priority scores correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      expect(screen.getByText('75')).toBeInTheDocument(); // High priority score
      expect(screen.getByText('45')).toBeInTheDocument(); // Low priority score
      expect(screen.getByText('85')).toBeInTheDocument(); // Impact score
      expect(screen.getByText('60')).toBeInTheDocument(); // Effort score
    });
  });

  it('handles auto-calculate toggle', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      const autoCalculateCheckbox = screen.getByLabelText(
        'Auto-calculate priority scores'
      );
      expect(autoCalculateCheckbox).toBeChecked();
    });

    const autoCalculateCheckbox = screen.getByLabelText(
      'Auto-calculate priority scores'
    );
    fireEvent.click(autoCalculateCheckbox);

    expect(autoCalculateCheckbox).not.toBeChecked();
  });

  it('handles manual recalculation', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      });

    render(<RequestPrioritization />);

    await waitFor(() => {
      const recalculateButton = screen.getByText('Recalculate');
      fireEvent.click(recalculateButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('displays request details correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      expect(screen.getByText('High Priority Feature')).toBeInTheDocument();
      expect(
        screen.getByText('This is a high priority feature request')
      ).toBeInTheDocument();
      expect(screen.getByText('UI/UX')).toBeInTheDocument();
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('ui')).toBeInTheDocument();
    });
  });

  it('handles error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<RequestPrioritization />);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<RequestPrioritization />);

    expect(
      screen.getByRole('progressbar', { hidden: true })
    ).toBeInTheDocument();
  });

  it('handles criteria weight changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      const impactSlider = screen.getByLabelText('Impact Weight');
      fireEvent.change(impactSlider, { target: { value: '40' } });
    });

    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('displays priority colors correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      const highPriorityBadge = screen.getByText('high');
      const lowPriorityBadge = screen.getByText('low');

      expect(highPriorityBadge).toBeInTheDocument();
      expect(lowPriorityBadge).toBeInTheDocument();
    });
  });

  it('handles selection and deselection of requests', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // Select first request
    });

    await waitFor(() => {
      expect(screen.getByText('1 request(s) selected')).toBeInTheDocument();
    });

    // Deselect
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(
        screen.queryByText('1 request(s) selected')
      ).not.toBeInTheDocument();
    });
  });

  it('handles save criteria functionality', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ requests: mockRequests }),
    });

    render(<RequestPrioritization />);

    await waitFor(() => {
      const saveButton = screen.getByText('Save Criteria');
      fireEvent.click(saveButton);
    });

    // This would typically make an API call to save criteria
    // The actual implementation would depend on the backend
  });
});
