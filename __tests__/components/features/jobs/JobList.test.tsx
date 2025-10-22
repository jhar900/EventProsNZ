import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobList } from '@/components/features/jobs/JobList';
import { Job } from '@/types/jobs';

// Mock fetch
global.fetch = jest.fn();

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
  }),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 days ago'),
}));

const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Wedding Photographer Needed',
    description:
      'Looking for an experienced wedding photographer for a summer wedding.',
    job_type: 'event_manager',
    service_category: 'photography',
    budget_range_min: 1000,
    budget_range_max: 2000,
    location: 'Auckland',
    coordinates: { lat: -36.8485, lng: 174.7633 },
    is_remote: false,
    status: 'active',
    posted_by_user_id: 'user-1',
    event_id: null,
    special_requirements: 'Must have portfolio',
    contact_email: 'contact@example.com',
    contact_phone: '+64 21 123 4567',
    response_preferences: 'email',
    timeline_start_date: '2024-06-01',
    timeline_end_date: '2024-06-02',
    view_count: 10,
    application_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'job-2',
    title: 'Event Catering Required',
    description: 'Need catering for a corporate event with 100 guests.',
    job_type: 'contractor_internal',
    service_category: 'catering',
    budget_range_min: 2000,
    budget_range_max: 3000,
    location: 'Wellington',
    coordinates: { lat: -41.2924, lng: 174.7787 },
    is_remote: false,
    status: 'active',
    posted_by_user_id: 'user-2',
    event_id: null,
    special_requirements: 'Vegetarian options required',
    contact_email: 'catering@example.com',
    contact_phone: '+64 4 123 4567',
    response_preferences: 'phone',
    timeline_start_date: '2024-07-15',
    timeline_end_date: '2024-07-15',
    view_count: 5,
    application_count: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('JobList', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders job list with initial jobs', () => {
    render(<JobList initialJobs={mockJobs} />);

    expect(screen.getByText('Wedding Photographer Needed')).toBeInTheDocument();
    expect(screen.getByText('Event Catering Required')).toBeInTheDocument();
  });

  it('displays job count correctly', () => {
    render(<JobList initialJobs={mockJobs} />);

    expect(screen.getByText('2 jobs found')).toBeInTheDocument();
  });

  it('shows loading state when fetching jobs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: [], total: 0, total_pages: 0 }),
    });

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Loading jobs...')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Error loading jobs')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows no jobs message when no jobs found', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: [], total: 0, total_pages: 0 }),
    });

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('No jobs found')).toBeInTheDocument();
    });
  });

  it('calls onJobSelect when job card is clicked', () => {
    const mockOnJobSelect = jest.fn();
    render(<JobList initialJobs={mockJobs} onJobSelect={mockOnJobSelect} />);

    fireEvent.click(screen.getByText('Wedding Photographer Needed'));
    expect(mockOnJobSelect).toHaveBeenCalledWith(mockJobs[0]);
  });

  it('calls onJobApply when apply button is clicked', () => {
    const mockOnJobApply = jest.fn();
    render(<JobList initialJobs={mockJobs} onJobApply={mockOnJobApply} />);

    const applyButtons = screen.getAllByText('Apply Now');
    fireEvent.click(applyButtons[0]);
    expect(mockOnJobApply).toHaveBeenCalledWith(mockJobs[0]);
  });

  it('disables apply button for non-active jobs', () => {
    const inactiveJob = { ...mockJobs[0], status: 'filled' as const };
    render(<JobList initialJobs={[inactiveJob]} />);

    const applyButton = screen.getByText('Apply Now');
    expect(applyButton).toBeDisabled();
  });

  it('shows search functionality', () => {
    render(<JobList showSearch={true} />);

    expect(
      screen.getByPlaceholderText(
        /Search jobs by title, description, or location/
      )
    ).toBeInTheDocument();
  });

  it('shows filters when showFilters is true', () => {
    render(<JobList showFilters={true} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('handles search input correctly', () => {
    render(<JobList showSearch={true} />);

    const searchInput = screen.getByPlaceholderText(
      /Search jobs by title, description, or location/
    );
    fireEvent.change(searchInput, { target: { value: 'photographer' } });
    expect(searchInput).toHaveValue('photographer');
  });

  it('shows pagination when there are multiple pages', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        jobs: mockJobs,
        total: 25,
        total_pages: 3,
        page: 1,
        limit: 10,
      }),
    });

    render(<JobList />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  it('displays job details correctly', () => {
    render(<JobList initialJobs={mockJobs} />);

    // Check job title
    expect(screen.getByText('Wedding Photographer Needed')).toBeInTheDocument();

    // Check job description
    expect(
      screen.getByText(
        'Looking for an experienced wedding photographer for a summer wedding.'
      )
    ).toBeInTheDocument();

    // Check service category
    expect(screen.getByText('PHOTOGRAPHY')).toBeInTheDocument();

    // Check location
    expect(screen.getByText('Auckland')).toBeInTheDocument();

    // Check budget
    expect(screen.getByText('$1,000 - $2,000')).toBeInTheDocument();

    // Check status
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows special requirements when present', () => {
    render(<JobList initialJobs={mockJobs} />);

    expect(screen.getByText('Special Requirements:')).toBeInTheDocument();
    expect(screen.getByText('Must have portfolio')).toBeInTheDocument();
  });

  it('shows contact information when present', () => {
    render(<JobList initialJobs={mockJobs} />);

    expect(screen.getByText('contact@example.com')).toBeInTheDocument();
    expect(screen.getByText('+64 21 123 4567')).toBeInTheDocument();
  });

  it('shows job statistics', () => {
    render(<JobList initialJobs={mockJobs} />);

    expect(screen.getByText('10 views')).toBeInTheDocument();
    expect(screen.getByText('3 applications')).toBeInTheDocument();
  });

  it('handles empty initial jobs array', () => {
    render(<JobList initialJobs={[]} />);

    expect(screen.getByText('0 jobs found')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<JobList className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
