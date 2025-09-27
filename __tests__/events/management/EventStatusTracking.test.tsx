import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventStatusTracking } from '@/components/features/events/management/EventStatusTracking';

// Mock fetch
global.fetch = jest.fn();

describe('EventStatusTracking Component', () => {
  const mockStatusHistory = [
    {
      id: 'history-1',
      previous_status: 'draft',
      new_status: 'planning',
      changed_by: 'user-1',
      reason: 'Requirements finalized',
      created_at: '2024-01-01T00:00:00Z',
      profiles: {
        first_name: 'John',
        last_name: 'Doe',
      },
    },
    {
      id: 'history-2',
      previous_status: 'planning',
      new_status: 'confirmed',
      changed_by: 'user-1',
      reason: 'All approvals received',
      created_at: '2024-01-02T00:00:00Z',
      profiles: {
        first_name: 'John',
        last_name: 'Doe',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          event: {
            event_status_history: mockStatusHistory,
          },
        }),
    });
  });

  it('should render status tracking interface', () => {
    render(<EventStatusTracking eventId="event-1" />);

    expect(screen.getByText('Update Event Status')).toBeInTheDocument();
    expect(screen.getByText('Status History')).toBeInTheDocument();
  });

  it('should display status history', async () => {
    render(<EventStatusTracking eventId="event-1" />);

    await waitFor(() => {
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });
  });

  it('should show update status form when button is clicked', () => {
    render(<EventStatusTracking eventId="event-1" />);

    const updateButton = screen.getByText('Update Status');
    fireEvent.click(updateButton);

    expect(screen.getByText('New Status')).toBeInTheDocument();
    expect(screen.getByText('Reason (Optional)')).toBeInTheDocument();
  });

  it('should handle status update submission', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            event: {
              event_status_history: mockStatusHistory,
            },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            event: { status: 'confirmed' },
          }),
      });

    render(<EventStatusTracking eventId="event-1" />);

    // Open update form
    const updateButton = screen.getByText('Update Status');
    fireEvent.click(updateButton);

    // Fill form
    const statusSelect = screen.getByRole('combobox');
    fireEvent.click(statusSelect);

    const reasonTextarea = screen.getByPlaceholderText(
      'Enter reason for status change...'
    );
    fireEvent.change(reasonTextarea, {
      target: { value: 'All requirements met' },
    });

    // Submit form
    const submitButton = screen.getByText('Update Status');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/events/event-1/status',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  it('should display empty state when no status history', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          event: {
            event_status_history: [],
          },
        }),
    });

    render(<EventStatusTracking eventId="event-1" />);

    await waitFor(() => {
      expect(
        screen.getByText('No status changes recorded yet')
      ).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<EventStatusTracking eventId="event-1" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should handle form cancellation', () => {
    render(<EventStatusTracking eventId="event-1" />);

    // Open update form
    const updateButton = screen.getByText('Update Status');
    fireEvent.click(updateButton);

    // Cancel form
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.getByText('Update Status')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<EventStatusTracking eventId="event-1" />);

    // Open update form
    const updateButton = screen.getByText('Update Status');
    fireEvent.click(updateButton);

    // Try to submit without selecting status
    const submitButton = screen.getByText('Update Status');
    expect(submitButton).toBeDisabled();
  });

  it('should display status change reasons', async () => {
    render(<EventStatusTracking eventId="event-1" />);

    await waitFor(() => {
      expect(screen.getByText('Requirements finalized')).toBeInTheDocument();
      expect(screen.getByText('All approvals received')).toBeInTheDocument();
    });
  });

  it('should show user information for status changes', async () => {
    render(<EventStatusTracking eventId="event-1" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
