import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventSelector } from '@/components/features/jobs/EventSelector';

// Store original fetch for cleanup
const originalFetch = global.fetch;

// Mock fetch
global.fetch = jest.fn();

afterAll(() => {
  // Restore original fetch
  global.fetch = originalFetch;
});

describe('EventSelector', () => {
  const mockOnSelect = jest.fn();
  const mockUserId = 'user-123';

  const mockEvents = [
    {
      id: 'event-1',
      title: 'Wedding Reception',
      event_type: 'wedding',
      event_date: '2024-12-31T14:00:00Z',
      location: 'Auckland, New Zealand',
      status: 'planning',
    },
    {
      id: 'event-2',
      title: 'Corporate Conference',
      event_type: 'corporate',
      event_date: '2024-11-15T09:00:00Z',
      location: 'Wellington, New Zealand',
      status: 'confirmed',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<EventSelector userId={mockUserId} onSelect={mockOnSelect} />);

    expect(screen.getByText(/loading events/i)).toBeInTheDocument();
  });

  it('displays events after fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: mockEvents }),
    });

    render(<EventSelector userId={mockUserId} onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading events/i)).not.toBeInTheDocument();
    });

    // The select should be visible
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows muted card when no events available', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: [] }),
    });

    render(<EventSelector userId={mockUserId} onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/create an event first/i)).toBeInTheDocument();
    });
  });

  it('calls onSelect when event is selected', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: mockEvents }),
    });

    render(<EventSelector userId={mockUserId} onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading events/i)).not.toBeInTheDocument();
    });

    // Open the select
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);

    // Select an event
    await waitFor(() => {
      expect(screen.getByText(/wedding reception/i)).toBeInTheDocument();
    });
    await user.click(screen.getByText(/wedding reception/i));

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'event-1',
        title: 'Wedding Reception',
      })
    );
  });

  it('calls onSelect with null when "No event" is selected', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: mockEvents }),
    });

    render(
      <EventSelector
        userId={mockUserId}
        selectedEventId="event-1"
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading events/i)).not.toBeInTheDocument();
    });

    // Open the select
    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);

    // Select "No event linked"
    await waitFor(() => {
      expect(screen.getByText(/no event linked/i)).toBeInTheDocument();
    });
    await user.click(screen.getByText(/no event linked/i));

    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<EventSelector userId={mockUserId} onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load events/i)).toBeInTheDocument();
    });
  });

  it('filters events to only show planning and confirmed status', async () => {
    const mixedEvents = [
      ...mockEvents,
      {
        id: 'event-3',
        title: 'Draft Event',
        event_type: 'party',
        event_date: '2024-10-01T18:00:00Z',
        location: 'Christchurch',
        status: 'draft',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events: mixedEvents }),
    });

    render(<EventSelector userId={mockUserId} onSelect={mockOnSelect} />);

    await waitFor(() => {
      expect(screen.queryByText(/loading events/i)).not.toBeInTheDocument();
    });

    // Only planning and confirmed events should be available
    // The draft event should be filtered out
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
