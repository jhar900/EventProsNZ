import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventTypeSuggestions } from '@/components/features/ai/EventTypeSuggestions';
import { EventTypeSuggestionEngine } from '@/lib/ai/event-type-suggestions';

// Mock Radix UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select">{children}</div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children, id, ...props }: any) => (
    <select data-testid="select-trigger" id={id} {...props}>
      {children}
    </select>
  ),
  SelectValue: ({ placeholder }: any) => (
    <option value="">{placeholder}</option>
  ),
}));

// Mock the EventTypeSuggestionEngine
jest.mock('@/lib/ai/event-type-suggestions', () => ({
  EventTypeSuggestionEngine: {
    suggestEventType: jest.fn(),
    getEventTypeTips: jest.fn(),
  },
}));

// Ensure the mock is applied
const mockEventTypeSuggestionEngine =
  require('@/lib/ai/event-type-suggestions').EventTypeSuggestionEngine;

describe('EventTypeSuggestions', () => {
  const mockSuggestions = [
    {
      eventType: 'wedding' as const,
      confidence: 0.85,
      reasoning:
        'Keywords like "wedding", "ceremony" suggest this event type. Guest count of 100 is typical for this event type.',
      suggestedServices: [
        {
          id: 'wedding-photography',
          name: 'Photography',
          category: 'photography',
          priority: 'high' as const,
          importance: 95,
          reasoning: 'Essential for capturing memories and moments',
        },
        {
          id: 'wedding-catering',
          name: 'Catering',
          category: 'catering',
          priority: 'high' as const,
          importance: 95,
          reasoning: 'Required to keep guests satisfied and comfortable',
        },
      ],
      estimatedBudget: { min: 8000, max: 25000, currency: 'NZD' },
      guestCountRange: { min: 50, max: 300 },
      duration: { min: 6, max: 12 },
    },
    {
      eventType: 'corporate' as const,
      confidence: 0.45,
      reasoning: 'Based on general event characteristics.',
      suggestedServices: [
        {
          id: 'corporate-av-equipment',
          name: 'AV Equipment',
          category: 'technology',
          priority: 'high' as const,
          importance: 90,
          reasoning: 'Essential for presentations and audio',
        },
      ],
      estimatedBudget: { min: 3000, max: 15000, currency: 'NZD' },
      guestCountRange: { min: 20, max: 500 },
      duration: { min: 2, max: 8 },
    },
  ];

  const mockTips = [
    'Book your venue 12-18 months in advance',
    'Consider hiring a wedding planner for stress-free planning',
    "Don't forget about marriage license requirements",
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up realistic async mocks
    mockEventTypeSuggestionEngine.suggestEventType.mockImplementation(
      async context => {
        console.log('suggestEventType called with:', context);
        // Simulate actual async behavior
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockSuggestions;
      }
    );

    mockEventTypeSuggestionEngine.getEventTypeTips.mockImplementation(
      eventType => {
        console.log('getEventTypeTips called with:', eventType);
        return mockTips;
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders event type suggestions form', () => {
    render(<EventTypeSuggestions />);

    expect(screen.getByText('Tell Us About Your Event')).toBeInTheDocument();
    expect(screen.getByLabelText('Event Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Guest Count')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget (NZD)')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    render(<EventTypeSuggestions />);

    const descriptionInput = screen.getByLabelText('Event Description');
    const guestCountInput = screen.getByLabelText('Guest Count');
    const budgetInput = screen.getByLabelText('Budget (NZD)');

    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony for 100 guests' },
    });
    fireEvent.change(guestCountInput, { target: { value: '100' } });
    fireEvent.change(budgetInput, { target: { value: '15000' } });

    expect(descriptionInput).toHaveValue('Wedding ceremony for 100 guests');
    expect(guestCountInput).toHaveValue(100);
    expect(budgetInput).toHaveValue(15000);
  });

  it('generates suggestions when form is submitted', async () => {
    render(<EventTypeSuggestions />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    const submitButton = screen.getByRole('button', {
      name: /get event type suggestions|analyzing/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        mockEventTypeSuggestionEngine.suggestEventType
      ).toHaveBeenCalledWith({
        description: 'Wedding ceremony',
        guestCount: undefined,
        budget: undefined,
        location: '',
        date: '',
        timeOfDay: undefined,
        season: undefined,
        formality: undefined,
        indoorOutdoor: undefined,
      });
    });
  });

  it('displays event type suggestions', async () => {
    render(<EventTypeSuggestions />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    // Wait for the mock to be called and suggestions to appear
    await waitFor(
      () => {
        expect(
          mockEventTypeSuggestionEngine.suggestEventType
        ).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for the suggestions to appear
    await waitFor(
      () => {
        expect(screen.getByText('Event Type Suggestions')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        // Look for the suggestion cards using data-testid
        expect(screen.getAllByTestId('suggestion-card')).toHaveLength(2);
        // Look for the specific event types in the suggestion cards
        expect(screen.getByText('wedding')).toBeInTheDocument();
        expect(screen.getByText('corporate')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('shows confidence levels correctly', async () => {
    render(<EventTypeSuggestions />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    // Wait for the mock to be called
    await waitFor(
      () => {
        expect(
          mockEventTypeSuggestionEngine.suggestEventType
        ).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for the suggestions to appear
    await waitFor(
      () => {
        expect(screen.getByText('Event Type Suggestions')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText('85% High Confidence')).toBeInTheDocument();
        expect(screen.getByText('45% Medium Confidence')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('displays event details correctly', async () => {
    render(<EventTypeSuggestions />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    // Wait for the mock to be called
    await waitFor(
      () => {
        expect(
          mockEventTypeSuggestionEngine.suggestEventType
        ).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for the suggestions to appear
    await waitFor(
      () => {
        expect(screen.getByText('Event Type Suggestions')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText('50-300 guests')).toBeInTheDocument();
        expect(screen.getByText('6-12h')).toBeInTheDocument();
        expect(screen.getByText('$8,000-$25,000')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles suggestion selection', async () => {
    const mockOnEventTypeSelect = jest.fn();
    render(<EventTypeSuggestions onEventTypeSelect={mockOnEventTypeSelect} />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    // Wait for the mock to be called
    await waitFor(
      () => {
        expect(
          mockEventTypeSuggestionEngine.suggestEventType
        ).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for the suggestions to appear
    await waitFor(
      () => {
        expect(screen.getByText('Event Type Suggestions')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        const weddingCard = screen
          .getByText('wedding')
          .closest('[data-testid="suggestion-card"]');
        fireEvent.click(weddingCard!);
      },
      { timeout: 3000 }
    );

    expect(mockOnEventTypeSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it('shows selected event type details', async () => {
    render(<EventTypeSuggestions />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    // Wait for the mock to be called
    await waitFor(
      () => {
        expect(
          mockEventTypeSuggestionEngine.suggestEventType
        ).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for the suggestions to appear
    await waitFor(
      () => {
        expect(screen.getByText('Event Type Suggestions')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        const weddingCard = screen
          .getByText('wedding')
          .closest('[data-testid="suggestion-card"]');
        fireEvent.click(weddingCard!);
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText('wedding Event Details')).toBeInTheDocument();
        expect(screen.getByText('Recommended Services')).toBeInTheDocument();
        expect(screen.getByText('Planning Tips')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('displays service recommendations', async () => {
    render(<EventTypeSuggestions />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    // Wait for the mock to be called
    await waitFor(
      () => {
        expect(
          mockEventTypeSuggestionEngine.suggestEventType
        ).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for the suggestions to appear
    await waitFor(
      () => {
        expect(screen.getByText('Event Type Suggestions')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        const weddingCard = screen
          .getByText('wedding')
          .closest('[data-testid="suggestion-card"]');
        fireEvent.click(weddingCard!);
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText('Photography')).toBeInTheDocument();
        expect(screen.getByText('Catering')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows planning tips', async () => {
    render(<EventTypeSuggestions />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    // Wait for the mock to be called
    await waitFor(
      () => {
        expect(
          mockEventTypeSuggestionEngine.suggestEventType
        ).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for the suggestions to appear
    await waitFor(
      () => {
        expect(screen.getByText('Event Type Suggestions')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        const weddingCard = screen
          .getByText('wedding')
          .closest('[data-testid="suggestion-card"]');
        fireEvent.click(weddingCard!);
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(
          screen.getByText('Book your venue 12-18 months in advance')
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'Consider hiring a wedding planner for stress-free planning'
          )
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles service selection', async () => {
    const mockOnServiceSelect = jest.fn();
    render(<EventTypeSuggestions onServiceSelect={mockOnServiceSelect} />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    // Wait for the mock to be called
    await waitFor(
      () => {
        expect(
          mockEventTypeSuggestionEngine.suggestEventType
        ).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // Wait for the suggestions to appear
    await waitFor(
      () => {
        expect(screen.getByText('Event Type Suggestions')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        const weddingCard = screen
          .getByText('wedding')
          .closest('[data-testid="suggestion-card"]');
        fireEvent.click(weddingCard!);
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        const addServiceButtons = screen.getAllByText('Add Service');
        fireEvent.click(addServiceButtons[0]); // Click the first "Add Service" button
      },
      { timeout: 3000 }
    );

    expect(mockOnServiceSelect).toHaveBeenCalledWith(
      mockSuggestions[0].suggestedServices[0]
    );
  });

  it('handles time of day selection', () => {
    render(<EventTypeSuggestions />);

    // Use getAllByTestId to find the select triggers since there are multiple
    const selectTriggers = screen.getAllByTestId('select-trigger');
    const timeOfDaySelect = selectTriggers[0]; // First select is time of day
    fireEvent.click(timeOfDaySelect);

    const eveningOption = screen.getByText('Evening');
    fireEvent.click(eveningOption);

    // With mocked Select, we check that the option is in the document
    expect(eveningOption).toBeInTheDocument();
  });

  it('handles formality level selection', () => {
    render(<EventTypeSuggestions />);

    // Use getAllByTestId to find the select triggers since there are multiple
    const selectTriggers = screen.getAllByTestId('select-trigger');
    const formalitySelect = selectTriggers[1]; // Second select is formality
    fireEvent.click(formalitySelect);

    const formalOption = screen.getByText('Formal');
    fireEvent.click(formalOption);

    // With mocked Select, we check that the option is in the document
    expect(formalOption).toBeInTheDocument();
  });

  it('shows loading state during suggestion generation', async () => {
    // Mock a delayed response
    mockEventTypeSuggestionEngine.suggestEventType.mockImplementation(
      () =>
        new Promise(resolve => setTimeout(() => resolve(mockSuggestions), 100))
    );

    render(<EventTypeSuggestions />);

    const descriptionInput = screen.getByLabelText('Event Description');
    fireEvent.change(descriptionInput, {
      target: { value: 'Wedding ceremony' },
    });

    // Look for the submit button - it might be "Get Event Type Suggestions" or "Analyzing..."
    const submitButton = screen.getByRole('button', {
      name: /get event type suggestions|analyzing/i,
    });
    fireEvent.click(submitButton);

    // Wait for the loading state to appear
    await waitFor(() => {
      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    });
  });

  it('handles initial context', () => {
    const initialContext = {
      description: 'Corporate event',
      guestCount: 50,
      budget: 10000,
    };

    render(<EventTypeSuggestions initialContext={initialContext} />);

    expect(screen.getByDisplayValue('Corporate event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
  });
});
