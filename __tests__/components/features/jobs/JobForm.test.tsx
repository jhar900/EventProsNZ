import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobForm } from '@/components/features/jobs/JobForm';

// Mock fetch
global.fetch = jest.fn();

describe('JobForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders form fields correctly', () => {
    render(<JobForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/service category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/minimum budget/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum budget/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<JobForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /create job/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      ok: true,
      json: async () => ({ job: { id: '1', title: 'Test Job' } }),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<JobForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill in required fields
    await user.type(screen.getByLabelText(/job title/i), 'Test Job Title');
    await user.type(
      screen.getByLabelText(/job description/i),
      'Test job description'
    );
    await user.type(
      screen.getByLabelText(/location/i),
      'Auckland, New Zealand'
    );

    // Select service category (default is 'catering' but we need to ensure it's set)
    const serviceCategorySelect = screen.getByRole('combobox', {
      name: /service category/i,
    });
    await user.click(serviceCategorySelect);
    await waitFor(() => {
      const cateringOption = screen.getByRole('option', { name: 'Catering' });
      expect(cateringOption).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: 'Catering' }));

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create job/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Test Job Title'),
      });
      expect(mockOnSuccess).toHaveBeenCalledWith({
        id: '1',
        title: 'Test Job',
      });
    });
  });

  it('handles form submission error', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      ok: false,
      json: async () => ({ error: 'Server error' }),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<JobForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill in required fields
    await user.type(screen.getByLabelText(/job title/i), 'Test Job Title');
    await user.type(
      screen.getByLabelText(/job description/i),
      'Test job description'
    );
    await user.type(
      screen.getByLabelText(/location/i),
      'Auckland, New Zealand'
    );

    // Select service category
    const serviceCategorySelect = screen.getByRole('combobox', {
      name: /service category/i,
    });
    await user.click(serviceCategorySelect);
    await waitFor(() => {
      const cateringOption = screen.getByRole('option', { name: 'Catering' });
      expect(cateringOption).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: 'Catering' }));

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create job/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  it('pre-populates form with event data when useEventData is checked', async () => {
    const user = userEvent.setup();
    const eventData = {
      id: 'event-1',
      title: 'Test Event',
      event_type: 'wedding',
      event_date: '2024-12-31',
      location: 'Auckland, New Zealand',
      description: 'Test event description',
    };

    render(
      <JobForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        eventData={eventData}
      />
    );

    // Check the "Use from My Events" checkbox
    const useEventDataCheckbox = screen.getByLabelText(/use details from/i);
    await user.click(useEventDataCheckbox);

    await waitFor(() => {
      expect(
        screen.getByDisplayValue(/event manager for test event/i)
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(/test event description/i)
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(/auckland, new zealand/i)
      ).toBeInTheDocument();
    });
  });

  it('validates character limits', async () => {
    const user = userEvent.setup();
    render(<JobForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Test title character limit
    const titleInput = screen.getByLabelText(/job title/i);
    await user.type(titleInput, 'a'.repeat(201)); // Exceeds 200 character limit

    const submitButton = screen.getByRole('button', { name: /create job/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title too long/i)).toBeInTheDocument();
    });
  });

  it('handles remote work option', async () => {
    const user = userEvent.setup();
    render(<JobForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const remoteCheckbox = screen.getByLabelText(
      /this job can be done remotely/i
    );
    await user.click(remoteCheckbox);

    expect(remoteCheckbox).toBeChecked();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<JobForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
