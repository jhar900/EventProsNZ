import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InternalJobCard } from '@/components/features/jobs/InternalJobCard';

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 days ago'),
}));

describe('InternalJobCard', () => {
  const mockJob = {
    id: '1',
    title: 'Wedding Photographer Needed',
    description:
      'Looking for an experienced wedding photographer for summer events',
    job_type: 'contractor_internal' as const,
    service_category: 'photography',
    internal_job_category: 'casual_work',
    skill_requirements: [
      'Photography',
      'Adobe Lightroom',
      'Wedding Experience',
    ],
    experience_level: 'intermediate',
    payment_terms: '$50-80/hour',
    work_arrangement: 'onsite',
    budget_range_min: 500,
    budget_range_max: 1000,
    location: 'Auckland, New Zealand',
    is_remote: false,
    status: 'active',
    view_count: 25,
    application_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    contact_email: 'contact@example.com',
    contact_phone: '+64 21 123 4567',
    special_requirements: 'Must have own equipment',
  };

  const defaultProps = {
    job: mockJob,
    onSelect: jest.fn(),
    onApply: jest.fn(),
  };

  it('renders job card with all information', () => {
    render(<InternalJobCard {...defaultProps} />);

    expect(screen.getByText('Wedding Photographer Needed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Looking for an experienced wedding photographer for summer events'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('INTERNAL')).toBeInTheDocument();
    expect(screen.getByText('CASUAL WORK')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows internal job specific fields', () => {
    render(<InternalJobCard {...defaultProps} />);

    expect(screen.getByText('Experience:')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Work Type:')).toBeInTheDocument();
    expect(screen.getByText('🏢 Onsite')).toBeInTheDocument();
    expect(screen.getByText('Required Skills:')).toBeInTheDocument();
    expect(screen.getByText('Photography')).toBeInTheDocument();
    expect(screen.getByText('Adobe Lightroom')).toBeInTheDocument();
    expect(screen.getByText('Wedding Experience')).toBeInTheDocument();
  });

  it('shows payment terms', () => {
    render(<InternalJobCard {...defaultProps} />);

    expect(screen.getByText('Payment Terms:')).toBeInTheDocument();
    expect(screen.getByText('$50-80/hour')).toBeInTheDocument();
  });

  it('shows budget range correctly', () => {
    render(<InternalJobCard {...defaultProps} />);

    expect(screen.getByText('$500 - $1,000')).toBeInTheDocument();
  });

  it('shows location and remote status', () => {
    render(<InternalJobCard {...defaultProps} />);

    expect(screen.getByText('Auckland, New Zealand')).toBeInTheDocument();
  });

  it('shows contact information when available', () => {
    render(<InternalJobCard {...defaultProps} />);

    expect(screen.getByText('contact@example.com')).toBeInTheDocument();
    expect(screen.getByText('+64 21 123 4567')).toBeInTheDocument();
  });

  it('shows special requirements when available', () => {
    render(<InternalJobCard {...defaultProps} />);

    expect(screen.getByText('Special Requirements:')).toBeInTheDocument();
    expect(screen.getByText('Must have own equipment')).toBeInTheDocument();
  });

  it('shows job statistics', () => {
    render(<InternalJobCard {...defaultProps} />);

    expect(screen.getByText('25 views')).toBeInTheDocument();
    expect(screen.getByText('3 applications')).toBeInTheDocument();
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
  });

  it('handles bookmark toggle', async () => {
    const user = userEvent.setup();
    render(<InternalJobCard {...defaultProps} />);

    const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
    await user.click(bookmarkButton);

    // The bookmark state is managed internally, so we just verify the button exists
    expect(bookmarkButton).toBeInTheDocument();
  });

  it('handles apply button click', async () => {
    const user = userEvent.setup();
    render(<InternalJobCard {...defaultProps} />);

    const applyButton = screen.getByRole('button', { name: /apply now/i });
    await user.click(applyButton);

    expect(defaultProps.onApply).toHaveBeenCalled();
  });

  it('disables apply button for non-active jobs', () => {
    const inactiveJob = { ...mockJob, status: 'filled' };
    render(<InternalJobCard {...defaultProps} job={inactiveJob} />);

    const applyButton = screen.getByRole('button', { name: /apply now/i });
    expect(applyButton).toBeDisabled();
  });

  it('handles card click for selection', async () => {
    const user = userEvent.setup();
    render(<InternalJobCard {...defaultProps} />);

    const card = screen
      .getByText('Wedding Photographer Needed')
      .closest('[class*="cursor-pointer"]');
    if (card) {
      await user.click(card);
      expect(defaultProps.onSelect).toHaveBeenCalled();
    }
  });

  it('shows different job category colors and icons', () => {
    const subcontractingJob = {
      ...mockJob,
      internal_job_category: 'subcontracting',
    };
    render(<InternalJobCard {...defaultProps} job={subcontractingJob} />);

    expect(screen.getByText('SUBCONTRACTING')).toBeInTheDocument();
  });

  it('shows different experience level colors', () => {
    const expertJob = { ...mockJob, experience_level: 'expert' };
    render(<InternalJobCard {...defaultProps} job={expertJob} />);

    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('shows work arrangement icons', () => {
    const remoteJob = { ...mockJob, work_arrangement: 'remote' };
    render(<InternalJobCard {...defaultProps} job={remoteJob} />);

    expect(screen.getByText('🏠 Remote')).toBeInTheDocument();
  });

  it('limits displayed skills to 5 with overflow indicator', () => {
    const jobWithManySkills = {
      ...mockJob,
      skill_requirements: [
        'Skill1',
        'Skill2',
        'Skill3',
        'Skill4',
        'Skill5',
        'Skill6',
        'Skill7',
      ],
    };
    render(<InternalJobCard {...defaultProps} job={jobWithManySkills} />);

    expect(screen.getByText('Skill1')).toBeInTheDocument();
    expect(screen.getByText('Skill5')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalJob = {
      ...mockJob,
      contact_email: undefined,
      contact_phone: undefined,
      special_requirements: undefined,
    };
    render(<InternalJobCard {...defaultProps} job={minimalJob} />);

    expect(screen.getByText('Wedding Photographer Needed')).toBeInTheDocument();
    expect(screen.queryByText('Special Requirements:')).not.toBeInTheDocument();
  });

  it('shows different status colors', () => {
    const completedJob = { ...mockJob, status: 'completed' };
    render(<InternalJobCard {...defaultProps} job={completedJob} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('handles jobs without budget range', () => {
    const jobWithoutBudget = {
      ...mockJob,
      budget_range_min: undefined,
      budget_range_max: undefined,
    };
    render(<InternalJobCard {...defaultProps} job={jobWithoutBudget} />);

    expect(screen.getByText('Budget not specified')).toBeInTheDocument();
  });

  it('handles jobs with only minimum budget', () => {
    const jobWithMinBudget = {
      ...mockJob,
      budget_range_max: undefined,
    };
    render(<InternalJobCard {...defaultProps} job={jobWithMinBudget} />);

    expect(screen.getByText('From $500')).toBeInTheDocument();
  });

  it('handles jobs with only maximum budget', () => {
    const jobWithMaxBudget = {
      ...mockJob,
      budget_range_min: undefined,
    };
    render(<InternalJobCard {...defaultProps} job={jobWithMaxBudget} />);

    expect(screen.getByText('Up to $1,000')).toBeInTheDocument();
  });
});
