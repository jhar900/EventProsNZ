import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobCard } from '@/components/features/jobs/JobCard';
import { JobWithDetails } from '@/types/jobs';

describe('JobCard', () => {
  const mockJob: JobWithDetails = {
    id: 'job-1',
    title: 'Wedding Coordinator Needed',
    description:
      'Looking for an experienced wedding coordinator for a 150-guest event.',
    job_type: 'event_manager',
    service_category: 'catering',
    budget_range_min: 2000,
    budget_range_max: 5000,
    location: 'Auckland, New Zealand',
    coordinates: { lat: -36.8485, lng: 174.7633 },
    is_remote: false,
    status: 'active',
    posted_by_user_id: 'user-1',
    event_id: null,
    special_requirements: 'Must have experience with large weddings',
    contact_email: 'contact@example.com',
    contact_phone: '+64 21 123 4567',
    response_preferences: 'email',
    timeline_start_date: '2024-12-01',
    timeline_end_date: '2024-12-31',
    view_count: 25,
    application_count: 5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    posted_by_user: {
      id: 'user-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
    event: null,
    applications: [],
    analytics: {
      view_count: 25,
      application_count: 5,
      recent_views: 3,
    },
  };

  const mockOnView = jest.fn();
  const mockOnApply = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} onView={mockOnView} onApply={mockOnApply} />);

    expect(screen.getByText('Wedding Coordinator Needed')).toBeInTheDocument();
    expect(
      screen.getByText(/looking for an experienced wedding coordinator/i)
    ).toBeInTheDocument();
    expect(screen.getByText('$2,000 - $5,000')).toBeInTheDocument();
    expect(screen.getByText('Auckland, New Zealand')).toBeInTheDocument();
    expect(screen.getByText('Event Manager')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays job status badge correctly', () => {
    render(<JobCard job={mockJob} onView={mockOnView} onApply={mockOnApply} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows remote work badge when job is remote', () => {
    const remoteJob = { ...mockJob, is_remote: true };
    render(
      <JobCard job={remoteJob} onView={mockOnView} onApply={mockOnApply} />
    );

    expect(screen.getByText(/remote ok/i)).toBeInTheDocument();
  });

  it('displays special requirements when present', () => {
    render(<JobCard job={mockJob} onView={mockOnView} onApply={mockOnApply} />);

    expect(screen.getByText(/special requirements/i)).toBeInTheDocument();
    expect(
      screen.getByText(/must have experience with large weddings/i)
    ).toBeInTheDocument();
  });

  it('shows analytics for job owner', () => {
    render(
      <JobCard
        job={mockJob}
        onView={mockOnView}
        onApply={mockOnApply}
        isOwner={true}
      />
    );

    expect(screen.getByText('25')).toBeInTheDocument(); // view count
    expect(screen.getByText('5')).toBeInTheDocument(); // application count
  });

  it('calls onView when view button is clicked', async () => {
    const user = userEvent.setup();
    render(<JobCard job={mockJob} onView={mockOnView} onApply={mockOnApply} />);

    const viewButton = screen.getByRole('button', { name: /view details/i });
    await user.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith('job-1');
  });

  it('calls onApply when apply button is clicked', async () => {
    const user = userEvent.setup();
    render(<JobCard job={mockJob} onView={mockOnView} onApply={mockOnApply} />);

    const applyButton = screen.getByRole('button', { name: /apply now/i });
    await user.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith('job-1');
  });

  it('shows edit and analytics buttons for job owner', () => {
    render(
      <JobCard
        job={mockJob}
        onView={mockOnView}
        onApply={mockOnApply}
        isOwner={true}
      />
    );

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /analytics/i })
    ).toBeInTheDocument();
  });

  it('does not show apply button for job owner', () => {
    render(
      <JobCard
        job={mockJob}
        onView={mockOnView}
        onApply={mockOnApply}
        isOwner={true}
      />
    );

    expect(
      screen.queryByRole('button', { name: /apply now/i })
    ).not.toBeInTheDocument();
  });

  it('does not show apply button for inactive jobs', () => {
    const inactiveJob = { ...mockJob, status: 'filled' as const };
    render(
      <JobCard job={inactiveJob} onView={mockOnView} onApply={mockOnApply} />
    );

    expect(
      screen.queryByRole('button', { name: /apply now/i })
    ).not.toBeInTheDocument();
  });

  it('formats budget range correctly', () => {
    const jobWithMinBudget = { ...mockJob, budget_range_max: null };
    render(
      <JobCard
        job={jobWithMinBudget}
        onView={mockOnView}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('From $2,000')).toBeInTheDocument();
  });

  it('formats budget range with max only', () => {
    const jobWithMaxBudget = { ...mockJob, budget_range_min: null };
    render(
      <JobCard
        job={jobWithMaxBudget}
        onView={mockOnView}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('Up to $5,000')).toBeInTheDocument();
  });

  it('shows budget not specified when no budget range', () => {
    const jobWithoutBudget = {
      ...mockJob,
      budget_range_min: null,
      budget_range_max: null,
    };
    render(
      <JobCard
        job={jobWithoutBudget}
        onView={mockOnView}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('Budget not specified')).toBeInTheDocument();
  });

  it('displays timeline when available', () => {
    render(<JobCard job={mockJob} onView={mockOnView} onApply={mockOnApply} />);

    expect(screen.getByText(/1 Dec 2024 - 31 Dec 2024/i)).toBeInTheDocument();
  });

  it('displays posted by information', () => {
    render(<JobCard job={mockJob} onView={mockOnView} onApply={mockOnApply} />);

    expect(screen.getByText(/posted by john doe/i)).toBeInTheDocument();
  });

  it('displays posted date', () => {
    render(<JobCard job={mockJob} onView={mockOnView} onApply={mockOnApply} />);

    expect(screen.getByText(/15 Jan 2024/i)).toBeInTheDocument();
  });
});
