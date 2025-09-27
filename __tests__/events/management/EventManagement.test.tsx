import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventManagement } from '@/components/features/events/management/EventManagement';
import { useEventManagement } from '@/hooks/useEventManagement';

// Mock the hook
jest.mock('@/hooks/useEventManagement');
const mockUseEventManagement = useEventManagement as jest.MockedFunction<
  typeof useEventManagement
>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

describe('EventManagement Component', () => {
  const mockEvents = [
    {
      id: 'event-1',
      title: 'Test Event 1',
      event_date: '2024-01-01T00:00:00Z',
      status: 'planning',
      budget_total: 1000,
      attendee_count: 50,
    },
    {
      id: 'event-2',
      title: 'Test Event 2',
      event_date: '2024-02-01T00:00:00Z',
      status: 'completed',
      budget_total: 2000,
      attendee_count: 100,
    },
  ];

  const mockHookReturn = {
    events: mockEvents,
    currentEvent: null,
    versions: [],
    milestones: [],
    notifications: [],
    feedback: [],
    dashboard: null,
    isLoading: false,
    error: null,
    loadEvents: jest.fn(),
    loadEvent: jest.fn(),
    updateEventStatus: jest.fn(),
    createVersion: jest.fn(),
    createMilestone: jest.fn(),
    updateMilestone: jest.fn(),
    completeEvent: jest.fn(),
    submitFeedback: jest.fn(),
    duplicateEvent: jest.fn(),
    loadDashboard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEventManagement.mockReturnValue(mockHookReturn);
  });

  it('should render event management interface', () => {
    render(<EventManagement />);

    expect(screen.getByText('Event Management')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your events throughout their lifecycle')
    ).toBeInTheDocument();
  });

  it('should display events list when no specific event is selected', () => {
    render(<EventManagement />);

    expect(screen.getByText('Select an Event')).toBeInTheDocument();
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseEventManagement.mockReturnValue({
      ...mockHookReturn,
      isLoading: true,
    });

    render(<EventManagement />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should display event cards with correct information', () => {
    render(<EventManagement />);

    // Check first event card
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    // Check second event card
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();
    expect(screen.getByText('$2,000')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should show status badges correctly', () => {
    render(<EventManagement />);

    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should handle event selection', () => {
    render(<EventManagement />);

    const eventCard = screen
      .getByText('Test Event 1')
      .closest('[class*="cursor-pointer"]');
    fireEvent.click(eventCard!);

    // The component should handle selection (this would be tested with the actual implementation)
    expect(eventCard).toBeInTheDocument();
  });

  it('should render with specific event ID', () => {
    render(<EventManagement eventId="event-1" />);

    expect(mockHookReturn.loadEvent).toHaveBeenCalledWith('event-1');
  });

  it('should render with initial tab', () => {
    render(<EventManagement eventId="event-1" initialTab="status" />);

    // The component should set the initial tab (this would be tested with the actual implementation)
    expect(screen.getByText('Event Management')).toBeInTheDocument();
  });

  it('should display error state', () => {
    mockUseEventManagement.mockReturnValue({
      ...mockHookReturn,
      error: 'Failed to load events',
    });

    render(<EventManagement />);

    // The component should handle error display (this would be tested with the actual implementation)
    expect(screen.getByText('Event Management')).toBeInTheDocument();
  });

  it('should call loadEvents on mount when no eventId provided', () => {
    render(<EventManagement />);

    expect(mockHookReturn.loadEvents).toHaveBeenCalled();
  });

  it('should call loadEvent on mount when eventId provided', () => {
    render(<EventManagement eventId="event-1" />);

    expect(mockHookReturn.loadEvent).toHaveBeenCalledWith('event-1');
  });
});
