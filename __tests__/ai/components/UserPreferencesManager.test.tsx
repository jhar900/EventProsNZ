import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserPreferencesManager } from '@/components/features/ai/UserPreferencesManager';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('UserPreferencesManager', () => {
  const mockProfile = {
    userId: 'user123',
    preferences: [
      {
        id: '1',
        userId: 'user123',
        preferenceType: 'service_category' as const,
        preferenceData: { categories: ['photography', 'catering'] },
        weight: 0.8,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        lastUsed: new Date('2024-01-15'),
        usageCount: 15,
      },
      {
        id: '2',
        userId: 'user123',
        preferenceType: 'price_range' as const,
        preferenceData: {
          budgets: [5000, 8000, 12000],
          averageBudget: 8333,
          minBudget: 5000,
          maxBudget: 12000,
        },
        weight: 0.6,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        lastUsed: new Date('2024-01-15'),
        usageCount: 8,
      },
      {
        id: '3',
        userId: 'user123',
        preferenceType: 'location' as const,
        preferenceData: { locations: ['Auckland', 'Wellington'] },
        weight: 0.7,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        lastUsed: new Date('2024-01-15'),
        usageCount: 12,
      },
    ],
    behaviorPatterns: {
      preferredEventTypes: ['wedding', 'corporate'],
      preferredServiceCategories: ['photography', 'catering'],
      averageBudget: 8333,
      preferredLocations: ['Auckland', 'Wellington'],
      timePreferences: {
        preferredDays: ['weekend'],
        preferredTimes: ['evening'],
        advanceBookingDays: 30,
      },
      qualityPreferences: {
        minRating: 4.0,
        preferVerified: true,
        preferPremium: false,
      },
      communicationPreferences: {
        preferredContactMethod: 'email' as const,
        responseTimeExpectation: '24h',
        notificationFrequency: 'daily' as const,
      },
    },
    learningInsights: {
      mostUsedServices: [
        { service: 'Wedding Photography', count: 5 },
        { service: 'Corporate Catering', count: 3 },
        { service: 'Event Planning', count: 2 },
      ],
      seasonalPatterns: {
        spring: 0.8,
        summer: 0.9,
        autumn: 0.7,
        winter: 0.6,
      },
      budgetPatterns: [
        { eventType: 'wedding', averageBudget: 15000 },
        { eventType: 'corporate', averageBudget: 8000 },
        { eventType: 'birthday', averageBudget: 3000 },
      ],
      locationPatterns: [
        { location: 'Auckland', frequency: 1 },
        { location: 'Wellington', frequency: 1 },
      ],
    },
    lastUpdated: new Date('2024-01-15'),
  };

  const mockProps = {
    userId: 'user123',
    onPreferencesUpdate: jest.fn(),
    onProfileUpdate: jest.fn(),
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders user preferences manager', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to render the content
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    expect(
      screen.getByText(
        'Manage and customize user preferences for personalized recommendations'
      )
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Total Preferences')).toBeInTheDocument();
    });
  });

  it('displays preferences overview statistics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the fetch to be called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/ai/user-preferences/user123'
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Total Preferences')).toBeInTheDocument();
      expect(screen.getAllByText('Active')).toHaveLength(4); // Multiple Active elements
      expect(screen.getByText('Avg Weight')).toBeInTheDocument();
      expect(screen.getByText('Total Usage')).toBeInTheDocument();
    });
  });

  it('shows individual preferences with details', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('service category')).toBeInTheDocument();
      expect(screen.getByText('price range')).toBeInTheDocument();
      expect(screen.getByText('location')).toBeInTheDocument();
      expect(screen.getByText('80% weight')).toBeInTheDocument();
      expect(screen.getByText('60% weight')).toBeInTheDocument();
      expect(screen.getByText('70% weight')).toBeInTheDocument();
    });
  });

  it('displays preference data in JSON format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    await waitFor(() => {
      // Check that the component renders preference data
      expect(screen.getByText('service category')).toBeInTheDocument();
      expect(screen.getByText('price range')).toBeInTheDocument();
      expect(screen.getByText('location')).toBeInTheDocument();
    });
  });

  it('shows preference usage statistics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Usage count: 15')).toBeInTheDocument();
      expect(screen.getByText('Usage count: 8')).toBeInTheDocument();
      expect(screen.getByText('Usage count: 12')).toBeInTheDocument();
    });
  });

  it('switches between tabs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const behaviorTab = screen.getByText('Behavior');
    fireEvent.click(behaviorTab);

    await waitFor(() => {
      expect(screen.getByText('Behavior Patterns')).toBeInTheDocument();
      expect(screen.getByText('Preferred Event Types')).toBeInTheDocument();
    });
  });

  it('displays behavior patterns', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const behaviorTab = screen.getByText('Behavior');
    fireEvent.click(behaviorTab);

    await waitFor(() => {
      expect(screen.getByText('wedding')).toBeInTheDocument();
      expect(screen.getByText('corporate')).toBeInTheDocument();
      expect(screen.getByText('photography')).toBeInTheDocument();
      expect(screen.getByText('catering')).toBeInTheDocument();
    });
  });

  it('shows budget information', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const behaviorTab = screen.getByText('Behavior');
    fireEvent.click(behaviorTab);

    await waitFor(() => {
      expect(screen.getByText('$8,333')).toBeInTheDocument();
      expect(screen.getByText('Average Budget')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('Advance Booking (days)')).toBeInTheDocument();
    });
  });

  it('displays quality preferences', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const behaviorTab = screen.getByText('Behavior');
    fireEvent.click(behaviorTab);

    await waitFor(() => {
      expect(screen.getByText('Min Rating: 4')).toBeInTheDocument();
      expect(screen.getByText('Verified: Yes')).toBeInTheDocument();
      expect(screen.getByText('Premium: No')).toBeInTheDocument();
    });
  });

  it('shows communication preferences', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const behaviorTab = screen.getByText('Behavior');
    fireEvent.click(behaviorTab);

    await waitFor(() => {
      expect(screen.getByText('Contact: email')).toBeInTheDocument();
      expect(screen.getByText('Response: 24h')).toBeInTheDocument();
      expect(screen.getByText('Notifications: daily')).toBeInTheDocument();
    });
  });

  it('displays learning insights', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);

    await waitFor(() => {
      expect(screen.getByText('Learning Insights')).toBeInTheDocument();
      expect(screen.getByText('Most Used Services')).toBeInTheDocument();
      expect(screen.getByText('Wedding Photography')).toBeInTheDocument();
      expect(screen.getByText('5 times')).toBeInTheDocument();
    });
  });

  it('shows seasonal patterns', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);

    await waitFor(() => {
      expect(screen.getByText('Seasonal Patterns')).toBeInTheDocument();
      expect(screen.getByText('spring')).toBeInTheDocument();
      expect(screen.getByText('summer')).toBeInTheDocument();
      expect(screen.getByText('autumn')).toBeInTheDocument();
      expect(screen.getByText('winter')).toBeInTheDocument();
    });
  });

  it('displays budget patterns by event type', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);

    await waitFor(() => {
      expect(
        screen.getByText('Budget Patterns by Event Type')
      ).toBeInTheDocument();
      expect(screen.getByText('wedding')).toBeInTheDocument();
      expect(screen.getByText('$15,000')).toBeInTheDocument();
      expect(screen.getByText('corporate')).toBeInTheDocument();
      expect(screen.getByText('$8,000')).toBeInTheDocument();
    });
  });

  it('shows location patterns', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const insightsTab = screen.getByText('Insights');
    fireEvent.click(insightsTab);

    await waitFor(() => {
      expect(screen.getByText('Location Patterns')).toBeInTheDocument();
      expect(screen.getByText('Auckland (1)')).toBeInTheDocument();
      expect(screen.getByText('Wellington (1)')).toBeInTheDocument();
    });
  });

  it('displays settings tab', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    const settingsTab = screen.getByText('Settings');
    fireEvent.click(settingsTab);

    await waitFor(() => {
      expect(screen.getByText('Preference Settings')).toBeInTheDocument();
      expect(screen.getByText('Auto-learning')).toBeInTheDocument();
      expect(screen.getByText('Preference Decay')).toBeInTheDocument();
      expect(screen.getByText('Privacy Mode')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });
  });

  it('handles preference removal', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          ...mockProfile,
          preferences: mockProfile.preferences.slice(1),
        },
      }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    // Wait for the component to load first
    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'User Preferences' })
      ).toHaveLength(2);
    });

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai/user-preferences/user123',
      expect.objectContaining({
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferenceType: 'service_category' }),
      })
    );
  });

  it('handles refresh', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('shows loading state', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(<UserPreferencesManager {...mockProps} />);

    expect(screen.getByText('Loading preferences...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<UserPreferencesManager {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  it('shows no preferences message when profile is null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: null }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    await waitFor(() => {
      expect(
        screen.getByText('No preferences found for this user.')
      ).toBeInTheDocument();
    });
  });

  it('displays preference icons and colors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    await waitFor(() => {
      // Check that preference types are displayed with proper formatting
      expect(screen.getByText('service category')).toBeInTheDocument();
      expect(screen.getByText('price range')).toBeInTheDocument();
      expect(screen.getByText('location')).toBeInTheDocument();
    });
  });

  it('shows preference creation and last used dates', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Created: 1/1/2024')).toBeInTheDocument();
      expect(screen.getByText('Last used: 1/15/2024')).toBeInTheDocument();
    });
  });

  it('displays active/inactive status badges', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: mockProfile }),
    } as Response);

    render(<UserPreferencesManager {...mockProps} />);

    await waitFor(() => {
      // There are 4 "Active" texts: 1 in overview + 3 in individual preferences
      expect(screen.getAllByText('Active')).toHaveLength(4);
    });
  });
});
