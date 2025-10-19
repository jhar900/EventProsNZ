import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BasicCRM } from '@/components/features/crm/BasicCRM';

// Mock the child components
jest.mock('@/components/features/crm/ContactManagement', () => ({
  ContactManagement: () => (
    <div data-testid="contact-management">Contact Management</div>
  ),
}));

jest.mock('@/components/features/crm/MessageTracking', () => ({
  MessageTracking: () => (
    <div data-testid="message-tracking">Message Tracking</div>
  ),
}));

jest.mock('@/components/features/crm/NotesAndTags', () => ({
  NotesAndTags: () => <div data-testid="notes-and-tags">Notes and Tags</div>,
}));

jest.mock('@/components/features/crm/FollowUpReminders', () => ({
  FollowUpReminders: () => (
    <div data-testid="follow-up-reminders">Follow Up Reminders</div>
  ),
}));

jest.mock('@/components/features/crm/ContactSearch', () => ({
  ContactSearch: () => <div data-testid="contact-search">Contact Search</div>,
}));

jest.mock('@/components/features/crm/ContactExport', () => ({
  ContactExport: () => <div data-testid="contact-export">Contact Export</div>,
}));

jest.mock('@/components/features/crm/ActivityTimeline', () => ({
  ActivityTimeline: () => (
    <div data-testid="activity-timeline">Activity Timeline</div>
  ),
}));

describe('BasicCRM', () => {
  it('renders CRM dashboard with header', () => {
    render(<BasicCRM />);

    expect(screen.getByText('CRM Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your business relationships and interactions')
    ).toBeInTheDocument();
  });

  it('renders stats cards', async () => {
    render(<BasicCRM />);

    await waitFor(() => {
      expect(screen.getByText('Total Contacts')).toBeInTheDocument();
      expect(screen.getByText('Active Contacts')).toBeInTheDocument();
      expect(screen.getByText('Interactions')).toBeInTheDocument();
      expect(screen.getByText('Pending Reminders')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  it('renders tab navigation', () => {
    render(<BasicCRM />);

    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Reminders')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
  });

  it('shows contact management by default', () => {
    render(<BasicCRM />);

    expect(screen.getByTestId('contact-management')).toBeInTheDocument();
  });

  it('switches tabs when clicked', () => {
    render(<BasicCRM />);

    // Click on Messages tab
    fireEvent.click(screen.getByText('Messages'));
    expect(screen.getByTestId('message-tracking')).toBeInTheDocument();

    // Click on Notes tab
    fireEvent.click(screen.getByText('Notes'));
    expect(screen.getByTestId('notes-and-tags')).toBeInTheDocument();

    // Click on Reminders tab
    fireEvent.click(screen.getByText('Reminders'));
    expect(screen.getByTestId('follow-up-reminders')).toBeInTheDocument();

    // Click on Search tab
    fireEvent.click(screen.getByText('Search'));
    expect(screen.getByTestId('contact-search')).toBeInTheDocument();

    // Click on Export tab
    fireEvent.click(screen.getByText('Export'));
    expect(screen.getByTestId('contact-export')).toBeInTheDocument();

    // Click on Timeline tab
    fireEvent.click(screen.getByText('Timeline'));
    expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<BasicCRM />);

    expect(screen.getByText('Filter')).toBeInTheDocument();
    expect(screen.getByText('Add Contact')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Mock console.error to avoid error logs in test output
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock fetch to throw an error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<BasicCRM />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load CRM statistics')
      ).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('dismisses error when dismiss button is clicked', async () => {
    // Mock console.error to avoid error logs in test output
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock fetch to throw an error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<BasicCRM />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load CRM statistics')
      ).toBeInTheDocument();
    });

    // Click dismiss button
    fireEvent.click(screen.getByText('Dismiss'));

    await waitFor(() => {
      expect(
        screen.queryByText('Failed to load CRM statistics')
      ).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('applies custom className', () => {
    const { container } = render(<BasicCRM className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
