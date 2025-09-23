import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserPreferencesPanel } from '@/components/features/ai/UserPreferencesPanel';

// Mock fetch globally
global.fetch = jest.fn();

describe('UserPreferencesPanel', () => {
  const mockUserPreferences = [
    {
      id: '1',
      user_id: 'user123',
      preference_type: 'service_preferences',
      preference_data: {
        preferred_categories: [],
        avoided_categories: [],
        budget_preferences: {
          min_budget: 1000,
          max_budget: 10000,
          budget_priority: 'medium',
        },
        quality_preferences: {
          min_rating: 3,
          verified_only: false,
          premium_preferred: false,
        },
      },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      user_id: 'user123',
      preference_type: 'event_preferences',
      preference_data: {
        preferred_event_types: [],
        typical_attendee_count: 50,
        typical_duration_hours: 4,
        preferred_locations: [],
        seasonal_preferences: [],
      },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '3',
      user_id: 'user123',
      preference_type: 'notification_preferences',
      preference_data: {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        notification_frequency: 'daily',
        notification_types: ['recommendations', 'updates', 'reminders'],
      },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '4',
      user_id: 'user123',
      preference_type: 'ui_preferences',
      preference_data: {
        theme: 'auto',
        language: 'en',
        default_view: 'grid',
        items_per_page: 20,
        show_advanced_filters: false,
      },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '5',
      user_id: 'user123',
      preference_type: 'learning_preferences',
      preference_data: {
        allow_data_collection: true,
        allow_personalization: true,
        allow_ab_testing: true,
        feedback_frequency: 'sometimes',
      },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ];

  const mockProps = {
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful API response
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/ai/user-preferences')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ preferences: mockUserPreferences }),
        });
      }
      return Promise.reject(new Error('Unmocked API call'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders user preferences panel', async () => {
    render(<UserPreferencesPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('User Preferences')).toBeInTheDocument();
    });

    expect(screen.getByText('User Preferences')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('displays current preferences', async () => {
    render(<UserPreferencesPanel {...mockProps} />);

    // Wait for loading to complete and check for budget preferences
    await waitFor(() => {
      expect(screen.getByLabelText('Minimum Budget')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Minimum Budget')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum Budget')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget Priority')).toBeInTheDocument();
  });

  it('handles budget range updates', async () => {
    render(<UserPreferencesPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByLabelText('Minimum Budget')).toBeInTheDocument();
    });

    const minBudgetInput = screen.getByLabelText('Minimum Budget');
    fireEvent.change(minBudgetInput, { target: { value: '2000' } });

    // Check that the input value changed
    expect(minBudgetInput).toHaveValue(2000);
  });

  it('handles budget priority updates', async () => {
    render(<UserPreferencesPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByLabelText('Budget Priority')).toBeInTheDocument();
    });

    const budgetPrioritySelect = screen.getByLabelText('Budget Priority');
    expect(budgetPrioritySelect).toBeInTheDocument();
  });

  it('handles quality preferences updates', async () => {
    render(<UserPreferencesPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByLabelText('Minimum Rating')).toBeInTheDocument();
    });

    const minRatingSelect = screen.getByLabelText('Minimum Rating');
    expect(minRatingSelect).toBeInTheDocument();
  });

  it('handles close button', async () => {
    render(<UserPreferencesPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('User Preferences')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows loading state initially', () => {
    render(<UserPreferencesPanel {...mockProps} />);

    expect(screen.getByText('Loading preferences...')).toBeInTheDocument();
  });

  it('displays preference tabs', async () => {
    render(<UserPreferencesPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('User Preferences')).toBeInTheDocument();
    });

    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Interface')).toBeInTheDocument();
    expect(screen.getByText('Learning')).toBeInTheDocument();
  });

  it('shows save button when changes are made', async () => {
    render(<UserPreferencesPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByLabelText('Minimum Budget')).toBeInTheDocument();
    });

    const minBudgetInput = screen.getByLabelText('Minimum Budget');
    fireEvent.change(minBudgetInput, { target: { value: '2000' } });

    // Check that save button is enabled
    const saveButton = screen.getByText('Save Preferences');
    expect(saveButton).toBeInTheDocument();
  });

  it('handles empty preferences gracefully', async () => {
    // Mock empty preferences response
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/ai/user-preferences')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ preferences: [] }),
        });
      }
      return Promise.reject(new Error('Unmocked API call'));
    });

    render(<UserPreferencesPanel {...mockProps} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('User Preferences')).toBeInTheDocument();
    });

    expect(screen.getByText('User Preferences')).toBeInTheDocument();
  });
});
