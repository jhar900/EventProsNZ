import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobModerationDashboard from '@/components/features/admin/JobModerationDashboard';

// Mock fetch
global.fetch = jest.fn();

// Mock the API response
const mockJobs = [
  {
    id: '1',
    title: 'Wedding Photography',
    description: 'Looking for a professional wedding photographer',
    location: 'Auckland',
    budget: 2000,
    event_date: '2024-06-15',
    status: 'pending',
    quality_score: 85,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    user_id: 'user1',
    user_name: 'John Doe',
    user_email: 'john@example.com',
    category: 'photography',
    urgency: 'medium',
    applications_count: 5,
    views_count: 25,
    flags: [],
  },
  {
    id: '2',
    title: 'Catering Service',
    description: 'Need catering for corporate event',
    location: 'Wellington',
    budget: 1500,
    event_date: '2024-07-20',
    status: 'approved',
    quality_score: 92,
    created_at: '2024-01-14T09:00:00Z',
    updated_at: '2024-01-14T09:00:00Z',
    user_id: 'user2',
    user_name: 'Jane Smith',
    user_email: 'jane@example.com',
    category: 'catering',
    urgency: 'high',
    applications_count: 8,
    views_count: 30,
    flags: [],
  },
];

describe('JobModerationDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: [] }),
    });

    render(<JobModerationDashboard />);

    expect(
      screen.getByText('Loading job moderation dashboard...')
    ).toBeInTheDocument();
  });

  it('renders job list after loading', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: mockJobs }),
    });

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (2)')).toBeInTheDocument();
    });

    expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
    expect(screen.getByText('Catering Service')).toBeInTheDocument();
  });

  it('filters jobs by status', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: mockJobs }),
    });

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (2)')).toBeInTheDocument();
    });

    // Filter by pending status
    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByText('Pending'));

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
      expect(screen.queryByText('Catering Service')).not.toBeInTheDocument();
    });
  });

  it('filters jobs by quality score', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: mockJobs }),
    });

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (2)')).toBeInTheDocument();
    });

    // Filter by quality score 80+
    const qualitySelect = screen.getByDisplayValue('All Scores');
    fireEvent.click(qualitySelect);
    fireEvent.click(screen.getByText('80+'));

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
      expect(screen.getByText('Catering Service')).toBeInTheDocument();
    });
  });

  it('searches jobs by title', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: mockJobs }),
    });

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (2)')).toBeInTheDocument();
    });

    // Search for "photography"
    const searchInput = screen.getByPlaceholderText('Search jobs...');
    fireEvent.change(searchInput, { target: { value: 'photography' } });

    await waitFor(() => {
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
      expect(screen.queryByText('Catering Service')).not.toBeInTheDocument();
    });
  });

  it('opens job details modal when view button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: mockJobs }),
    });

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (2)')).toBeInTheDocument();
    });

    // Click view button for first job
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
    });
  });

  it('moderates job when approve button is clicked', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: mockJobs }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: [] }),
      });

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (2)')).toBeInTheDocument();
    });

    // Click approve button for first job
    const approveButtons = screen.getAllByRole('button', { name: /approve/i });
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/jobs/1/moderate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          comment: '',
        }),
      });
    });
  });

  it('moderates job when reject button is clicked', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: mockJobs }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: [] }),
      });

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (2)')).toBeInTheDocument();
    });

    // Click reject button for first job
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/jobs/1/moderate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          comment: '',
        }),
      });
    });
  });

  it('displays job quality scores with correct colors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: mockJobs }),
    });

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (2)')).toBeInTheDocument();
    });

    // Check quality score colors
    const qualityScores = screen.getAllByText(/\/100/);
    expect(qualityScores[0]).toHaveClass('text-green-600'); // 85/100
    expect(qualityScores[1]).toHaveClass('text-green-600'); // 92/100
  });

  it('displays urgency badges correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: mockJobs }),
    });

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (2)')).toBeInTheDocument();
    });

    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<JobModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Job Postings (0)')).toBeInTheDocument();
    });
  });
});
