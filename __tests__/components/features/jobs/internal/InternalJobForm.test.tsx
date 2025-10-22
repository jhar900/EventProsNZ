import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InternalJobForm } from '@/components/features/jobs/InternalJobForm';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('InternalJobForm', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  const defaultProps = {
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  };

  it('renders form with all required fields', () => {
    render(<InternalJobForm {...defaultProps} />);

    expect(screen.getByText('Create Internal Job Posting')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Post internal business opportunities for additional staff or subcontractors'
      )
    ).toBeInTheDocument();

    // Check required fields
    expect(screen.getByLabelText(/job category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/service category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/required skills/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/experience level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/payment terms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/work arrangement/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
  });

  it('shows job category options with icons', () => {
    render(<InternalJobForm {...defaultProps} />);

    const categorySelect = screen.getByRole('combobox');
    fireEvent.click(categorySelect);

    expect(screen.getByText('Casual Work')).toBeInTheDocument();
    expect(screen.getByText('Subcontracting')).toBeInTheDocument();
    expect(screen.getByText('Partnerships')).toBeInTheDocument();
  });

  it('allows adding and removing skills', async () => {
    const user = userEvent.setup();
    render(<InternalJobForm {...defaultProps} />);

    const skillInput = screen.getByPlaceholderText(/add a required skill/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    // Add a skill
    await user.type(skillInput, 'Photography');
    await user.click(addButton);

    expect(screen.getAllByText('Photography')).toHaveLength(2); // One in select option, one in badge

    // Remove the skill
    const removeButton = screen.getByRole('button', { name: '×' });
    await user.click(removeButton);

    expect(screen.queryByText('Photography')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<InternalJobForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', {
      name: /create internal job/i,
    });
    await user.click(submitButton);

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Payment terms are required')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ job: { id: '1', title: 'Test Job' } }),
    });

    render(<InternalJobForm {...defaultProps} />);

    // Fill in required fields
    await user.type(
      screen.getByLabelText(/job title/i),
      'Wedding Photographer'
    );
    await user.type(
      screen.getByLabelText(/job description/i),
      'Looking for an experienced wedding photographer'
    );
    await user.type(screen.getByLabelText(/payment terms/i), '$50-80/hour');

    // Add a skill
    await user.type(
      screen.getByPlaceholderText(/add a required skill/i),
      'Photography'
    );
    await user.click(screen.getByRole('button', { name: /add/i }));

    // Wait for skill to be added
    await waitFor(() => {
      expect(screen.getAllByText('Photography')).toHaveLength(2);
    });

    // Submit form
    await user.click(
      screen.getByRole('button', { name: /create internal job/i })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/jobs/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Wedding Photographer'),
      });
    });

    expect(defaultProps.onSuccess).toHaveBeenCalled();
  });

  it('handles form submission errors', async () => {
    const user = userEvent.setup();
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to create job' }),
    });

    render(<InternalJobForm {...defaultProps} />);

    // Fill in required fields
    await user.type(
      screen.getByLabelText(/job title/i),
      'Wedding Photographer'
    );
    await user.type(
      screen.getByLabelText(/job description/i),
      'Looking for an experienced wedding photographer'
    );
    await user.type(screen.getByLabelText(/payment terms/i), '$50-80/hour');

    // Add a skill
    await user.type(
      screen.getByPlaceholderText(/add a required skill/i),
      'Photography'
    );
    await user.click(screen.getByRole('button', { name: /add/i }));

    // Wait for skill to be added
    await waitFor(() => {
      expect(screen.getAllByText('Photography')).toHaveLength(2);
    });

    // Submit form
    await user.click(
      screen.getByRole('button', { name: /create internal job/i })
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to create job')).toBeInTheDocument();
    });
  });

  it('shows editing mode when isEditing is true', () => {
    const initialData = {
      title: 'Existing Job',
      description: 'Existing description',
      internal_job_category: 'casual_work' as const,
    };

    render(
      <InternalJobForm
        {...defaultProps}
        isEditing={true}
        initialData={initialData}
      />
    );

    expect(screen.getByText('Edit Internal Job Posting')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Job')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Existing description')
    ).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<InternalJobForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('validates skill requirements', async () => {
    const user = userEvent.setup();
    render(<InternalJobForm {...defaultProps} />);

    // Fill in other required fields
    await user.type(
      screen.getByLabelText(/job title/i),
      'Wedding Photographer'
    );
    await user.type(
      screen.getByLabelText(/job description/i),
      'Looking for an experienced wedding photographer'
    );
    await user.type(screen.getByLabelText(/payment terms/i), '$50-80/hour');

    // Try to submit without skills
    await user.click(
      screen.getByRole('button', { name: /create internal job/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText('At least one skill is required')
      ).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<InternalJobForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/contact email/i), 'invalid-email');

    // Fill in required fields to trigger validation
    await user.type(
      screen.getByLabelText(/job title/i),
      'Wedding Photographer'
    );
    await user.type(
      screen.getByLabelText(/job description/i),
      'Looking for an experienced wedding photographer'
    );
    await user.type(screen.getByLabelText(/payment terms/i), '$50-80/hour');

    // Add a skill
    await user.type(
      screen.getByPlaceholderText(/add a required skill/i),
      'Photography'
    );
    await user.click(screen.getByRole('button', { name: /add/i }));

    // Wait for skill to be added
    await waitFor(() => {
      expect(screen.getAllByText('Photography')).toHaveLength(2);
    });

    await user.click(
      screen.getByRole('button', { name: /create internal job/i })
    );

    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });
});
